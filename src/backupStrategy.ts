import { log } from './logger';
import { errorHandler } from './errorHandler';
import { CONFIG } from './config';

export interface BackupStrategy {
  name: string;
  priority: number;
  isAvailable: () => Promise<boolean>;
  execute: () => Promise<any>;
}

export interface FallbackOptions {
  maxRetries: number;
  retryDelay: number;
  fallbackStrategies: BackupStrategy[];
}

export class BackupManager {
  private strategies: Map<string, BackupStrategy> = new Map();
  private fallbackHistory: Array<{ strategy: string; timestamp: Date; success: boolean }> = [];

  // Регистрация стратегии
  registerStrategy(strategy: BackupStrategy) {
    this.strategies.set(strategy.name, strategy);
    log.info('Backup strategy registered', { strategy: strategy.name, priority: strategy.priority });
  }

  // Выполнение операции с fallback
  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    options: Partial<FallbackOptions> = {}
  ): Promise<T> {
    const defaultOptions: FallbackOptions = {
      maxRetries: CONFIG.apiRetries,
      retryDelay: 1000,
      fallbackStrategies: Array.from(this.strategies.values()).sort((a, b) => a.priority - b.priority)
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Пытаемся выполнить основную операцию
    try {
      log.info('Executing primary operation');
      const result = await errorHandler.withRetry(
        primaryOperation,
        finalOptions.maxRetries,
        finalOptions.retryDelay,
        'Primary operation'
      );
      
      log.info('Primary operation succeeded');
      return result;
    } catch (error) {
      log.warn('Primary operation failed, trying fallback strategies', {
        error: error instanceof Error ? error.message : String(error)
      });

      // Пробуем резервные стратегии
      for (const strategy of finalOptions.fallbackStrategies) {
        try {
          log.info('Trying fallback strategy', { strategy: strategy.name });
          
          const isAvailable = await strategy.isAvailable();
          if (!isAvailable) {
            log.warn('Fallback strategy not available', { strategy: strategy.name });
            continue;
          }

          const result = await strategy.execute();
          log.info('Fallback strategy succeeded', { strategy: strategy.name });
          
          this.fallbackHistory.push({
            strategy: strategy.name,
            timestamp: new Date(),
            success: true
          });
          
          return result;
        } catch (strategyError) {
          log.error('Fallback strategy failed', {
            strategy: strategy.name,
            error: strategyError instanceof Error ? strategyError.message : String(strategyError)
          });
          
          this.fallbackHistory.push({
            strategy: strategy.name,
            timestamp: new Date(),
            success: false
          });
        }
      }

      // Все стратегии провалились
      log.error('All strategies failed');
      throw new Error('All backup strategies failed');
    }
  }

  // Получение статистики fallback
  getFallbackStats() {
    const totalAttempts = this.fallbackHistory.length;
    const successfulAttempts = this.fallbackHistory.filter(h => h.success).length;
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

    const strategyStats = new Map<string, { attempts: number; successes: number }>();
    
    for (const history of this.fallbackHistory) {
      const current = strategyStats.get(history.strategy) || { attempts: 0, successes: 0 };
      current.attempts++;
      if (history.success) current.successes++;
      strategyStats.set(history.strategy, current);
    }

    return {
      totalAttempts,
      successfulAttempts,
      successRate: Math.round(successRate * 100) / 100,
      strategyStats: Object.fromEntries(strategyStats),
      recentHistory: this.fallbackHistory.slice(-10) // последние 10 попыток
    };
  }

  // Очистка старой истории
  cleanupHistory(maxAge: number = 24 * 60 * 60 * 1000) { // 24 часа
    const cutoff = new Date(Date.now() - maxAge);
    this.fallbackHistory = this.fallbackHistory.filter(h => h.timestamp > cutoff);
  }
}

// Глобальный менеджер резервных стратегий
export const backupManager = new BackupManager();

// Очистка истории каждые 6 часов
setInterval(() => {
  backupManager.cleanupHistory();
}, 6 * 60 * 60 * 1000);

// Стратегия кэширования данных
export class CacheStrategy implements BackupStrategy {
  name = 'cache';
  priority = 1;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  async isAvailable(): Promise<boolean> {
    return this.cache.size > 0;
  }

  async execute(): Promise<any> {
    const now = Date.now();
    const validEntries = Array.from(this.cache.entries()).filter(
      ([_, entry]) => now - entry.timestamp < entry.ttl
    );

    if (validEntries.length === 0) {
      throw new Error('No valid cache entries available');
    }

    // Возвращаем самую свежую запись
    const [key, entry] = validEntries.sort((a, b) => b[1].timestamp - a[1].timestamp)[0];
    
    log.info('Using cached data', { key, age: now - entry.timestamp });
    return entry.data;
  }

  set(key: string, data: any, ttl: number = 60000) { // 1 минута по умолчанию
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }
}

// Стратегия offline режима
export class OfflineStrategy implements BackupStrategy {
  name = 'offline';
  priority = 2;
  private offlineData: any = null;

  async isAvailable(): Promise<boolean> {
    return this.offlineData !== null;
  }

  async execute(): Promise<any> {
    if (!this.offlineData) {
      throw new Error('No offline data available');
    }

    log.info('Using offline data');
    return this.offlineData;
  }

  setOfflineData(data: any) {
    this.offlineData = data;
    log.info('Offline data updated');
  }
}

// Стратегия альтернативного API
export class AlternativeApiStrategy implements BackupStrategy {
  name = 'alternative_api';
  priority = 3;
  private alternativeEndpoints: string[] = [];

  constructor(endpoints: string[] = []) {
    this.alternativeEndpoints = endpoints;
  }

  async isAvailable(): Promise<boolean> {
    return this.alternativeEndpoints.length > 0;
  }

  async execute(): Promise<any> {
    for (const endpoint of this.alternativeEndpoints) {
      try {
        log.info('Trying alternative API endpoint', { endpoint });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.apiTimeout);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          log.info('Alternative API succeeded', { endpoint });
          return data;
        }
      } catch (error) {
        log.warn('Alternative API endpoint failed', {
          endpoint,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    throw new Error('All alternative API endpoints failed');
  }

  addEndpoint(endpoint: string) {
    this.alternativeEndpoints.push(endpoint);
  }
}

// Стратегия деградированного режима
export class DegradedModeStrategy implements BackupStrategy {
  name = 'degraded_mode';
  priority = 4;
  private degradedData: any = null;

  async isAvailable(): Promise<boolean> {
    return this.degradedData !== null;
  }

  async execute(): Promise<any> {
    if (!this.degradedData) {
      throw new Error('No degraded mode data available');
    }

    log.warn('Using degraded mode data');
    return this.degradedData;
  }

  setDegradedData(data: any) {
    this.degradedData = data;
    log.warn('Degraded mode data updated');
  }
}

// Инициализация стратегий
export function initializeBackupStrategies() {
  const cacheStrategy = new CacheStrategy();
  const offlineStrategy = new OfflineStrategy();
  const alternativeApiStrategy = new AlternativeApiStrategy();
  const degradedModeStrategy = new DegradedModeStrategy();

  backupManager.registerStrategy(cacheStrategy);
  backupManager.registerStrategy(offlineStrategy);
  backupManager.registerStrategy(alternativeApiStrategy);
  backupManager.registerStrategy(degradedModeStrategy);

  log.info('Backup strategies initialized', {
    strategies: ['cache', 'offline', 'alternative_api', 'degraded_mode']
  });

  return {
    cacheStrategy,
    offlineStrategy,
    alternativeApiStrategy,
    degradedModeStrategy
  };
}
