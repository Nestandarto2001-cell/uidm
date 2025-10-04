import { log } from './logger';
import { MexcApi } from './mexc_ccxt';
import { MexcBrowser } from './browser';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  components: {
    api: ComponentHealth;
    browser: ComponentHealth;
    websocket: ComponentHealth;
    system: ComponentHealth;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  lastCheck: string;
  responseTime?: number;
  details?: any;
}

export class HealthChecker {
  private startTime: number;
  private api?: MexcApi;
  private browser?: MexcBrowser;
  private wsClients: Set<any> = new Set();

  constructor(api?: MexcApi, browser?: MexcBrowser) {
    this.startTime = Date.now();
    this.api = api;
    this.browser = browser;
  }

  // Регистрация WebSocket клиентов для мониторинга
  registerWebSocketClient(ws: any) {
    this.wsClients.add(ws);
  }

  unregisterWebSocketClient(ws: any) {
    this.wsClients.delete(ws);
  }

  // Проверка API
  private async checkApi(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      if (!this.api) {
        return {
          status: 'degraded',
          message: 'API not configured',
          lastCheck: new Date().toISOString()
        };
      }

      // Проверяем доступность API
      await this.api.canTrade('BTC');
      const responseTime = Date.now() - startTime;
      
      log.health('api', 'healthy', { responseTime });
      
      return {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      log.health('api', 'unhealthy', { error: message, responseTime });
      
      return {
        status: 'unhealthy',
        message,
        lastCheck: new Date().toISOString(),
        responseTime
      };
    }
  }

  // Проверка браузера
  private async checkBrowser(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      if (!this.browser) {
        return {
          status: 'degraded',
          message: 'Browser not initialized',
          lastCheck: new Date().toISOString()
        };
      }

      const status = this.browser.getStatus();
      const responseTime = Date.now() - startTime;
      
      if (status.working) {
        log.health('browser', 'healthy', { responseTime, retryCount: status.retryCount });
        
        return {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          responseTime,
          details: status
        };
      } else {
        log.health('browser', 'unhealthy', { responseTime, retryCount: status.retryCount });
        
        return {
          status: 'unhealthy',
          message: 'Browser not working',
          lastCheck: new Date().toISOString(),
          responseTime,
          details: status
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      log.health('browser', 'unhealthy', { error: message, responseTime });
      
      return {
        status: 'unhealthy',
        message,
        lastCheck: new Date().toISOString(),
        responseTime
      };
    }
  }

  // Проверка WebSocket
  private checkWebSocket(): ComponentHealth {
    const activeConnections = this.wsClients.size;
    
    if (activeConnections >= 0) {
      log.health('websocket', 'healthy', { activeConnections });
      
      return {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        details: { activeConnections }
      };
    } else {
      log.health('websocket', 'unhealthy', { activeConnections });
      
      return {
        status: 'unhealthy',
        message: 'No WebSocket connections',
        lastCheck: new Date().toISOString(),
        details: { activeConnections }
      };
    }
  }

  // Проверка системы
  private checkSystem(): ComponentHealth {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Проверяем использование памяти
      const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      let message: string | undefined;
      
      if (memoryUsagePercent > 90) {
        status = 'unhealthy';
        message = 'High memory usage';
      } else if (memoryUsagePercent > 70) {
        status = 'degraded';
        message = 'Elevated memory usage';
      }
      
      log.health('system', status === 'degraded' ? 'unhealthy' : status, { 
        memoryUsagePercent: Math.round(memoryUsagePercent),
        uptime: Math.round(uptime)
      });
      
      return {
        status,
        message,
        lastCheck: new Date().toISOString(),
        details: {
          memoryUsagePercent: Math.round(memoryUsagePercent),
          uptime: Math.round(uptime),
          nodeVersion: process.version,
          platform: process.platform
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      log.health('system', 'unhealthy', { error: message });
      
      return {
        status: 'unhealthy',
        message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  // Полная проверка здоровья системы
  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;
    
    try {
      // Параллельно проверяем все компоненты
      const [api, browser, websocket, system] = await Promise.all([
        this.checkApi(),
        this.checkBrowser(),
        Promise.resolve(this.checkWebSocket()),
        Promise.resolve(this.checkSystem())
      ]);

      // Определяем общий статус
      const componentStatuses = [api.status, browser.status, websocket.status, system.status];
      const unhealthyCount = componentStatuses.filter(status => status === 'unhealthy').length;
      const degradedCount = componentStatuses.filter(status => status === 'degraded').length;
      
      let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
      if (unhealthyCount > 0) {
        overallStatus = 'unhealthy';
      } else if (degradedCount > 0) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'healthy';
      }

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp,
        uptime,
        components: {
          api,
          browser,
          websocket,
          system
        },
        metrics: {
          memoryUsage: process.memoryUsage()
        }
      };

      log.info('Health check completed', { 
        status: overallStatus,
        unhealthyComponents: unhealthyCount,
        degradedComponents: degradedCount
      });

      return healthStatus;
    } catch (error) {
      log.error('Health check failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return {
        status: 'unhealthy',
        timestamp,
        uptime,
        components: {
          api: { status: 'unhealthy', message: 'Health check failed', lastCheck: timestamp },
          browser: { status: 'unhealthy', message: 'Health check failed', lastCheck: timestamp },
          websocket: { status: 'unhealthy', message: 'Health check failed', lastCheck: timestamp },
          system: { status: 'unhealthy', message: 'Health check failed', lastCheck: timestamp }
        },
        metrics: {
          memoryUsage: process.memoryUsage()
        }
      };
    }
  }

  // Получение краткого статуса
  async getQuickStatus(): Promise<{ status: string; message: string }> {
    try {
      const health = await this.checkHealth();
      return {
        status: health.status,
        message: health.status === 'healthy' ? 'All systems operational' : 
                 health.status === 'degraded' ? 'Some systems degraded' : 
                 'System issues detected'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Health check failed'
      };
    }
  }
}
