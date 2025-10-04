import { z } from 'zod';
import { log } from './logger';

// Схема валидации конфигурации
const configSchema = z.object({
  // UID для авторизации
  mexcUid: z.string().min(1, "MEXC_UID не может быть пустым"),
  
  // Базовый URL
  mexcBaseUrl: z.string().url("Некорректный URL MEXC"),
  
  // Функция для пути спота
  spotPath: z.function().args(z.string()).returns(z.string()),
  
  // Тайминги
  pollMs: z.number().min(100, "pollMs должен быть не менее 100ms").max(60000, "pollMs должен быть не более 60 секунд"),
  
  // Настройки браузера
  headless: z.boolean(),
  
  // Настройки мониторинга
  statusCheckInterval: z.number().min(5000, "statusCheckInterval должен быть не менее 5 секунд").max(300000, "statusCheckInterval должен быть не более 5 минут"),
  maxRetries: z.number().min(1, "maxRetries должен быть не менее 1").max(10, "maxRetries должен быть не более 10"),
  
  // Настройки логирования
  logLevel: z.enum(['error', 'warn', 'info', 'debug']),
  logToFile: z.boolean(),
  
  // Настройки API
  apiTimeout: z.number().min(1000, "apiTimeout должен быть не менее 1 секунды").max(60000, "apiTimeout должен быть не более 60 секунд"),
  apiRetries: z.number().min(1, "apiRetries должен быть не менее 1").max(10, "apiRetries должен быть не более 10"),
  
  // Настройки браузера
  browserTimeout: z.number().min(5000, "browserTimeout должен быть не менее 5 секунд").max(120000, "browserTimeout должен быть не более 2 минут"),
  pageLoadTimeout: z.number().min(1000, "pageLoadTimeout должен быть не менее 1 секунды").max(30000, "pageLoadTimeout должен быть не более 30 секунд"),
});

export type ConfigType = z.infer<typeof configSchema>;

// Функция валидации конфигурации
export function validateConfig(config: any): ConfigType {
  try {
    const validatedConfig = configSchema.parse(config);
    log.info("Configuration validated successfully");
    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      log.error("Configuration validation failed", { 
        errors: errorMessages,
        details: error.errors 
      });
      
      throw new Error(`Configuration validation failed: ${errorMessages}`);
    }
    
    log.error("Unknown configuration validation error", { error });
    throw error;
  }
}

// Функция для проверки переменных окружения
export function validateEnvironmentVariables() {
  const requiredEnvVars = ['MEXC_UID'];
  const missingVars: string[] = [];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(', ')}`;
    log.error("Environment validation failed", { missingVars });
    throw new Error(message);
  }
  
  log.info("Environment variables validated successfully");
}

// Функция для проверки зависимостей
export function validateDependencies() {
  const requiredPackages = ['playwright', 'ccxt', 'express', 'ws', 'winston'];
  const missingPackages: string[] = [];
  
  for (const packageName of requiredPackages) {
    try {
      require(packageName);
    } catch (error) {
      missingPackages.push(packageName);
    }
  }
  
  if (missingPackages.length > 0) {
    const message = `Missing required packages: ${missingPackages.join(', ')}. Run 'npm install' to install them.`;
    log.error("Dependencies validation failed", { missingPackages });
    throw new Error(message);
  }
  
  log.info("Dependencies validated successfully");
}

// Функция для полной валидации системы
export function validateSystem(config: any) {
  log.info("Starting system validation...");
  
  try {
    // Проверяем зависимости
    validateDependencies();
    
    // Проверяем переменные окружения
    validateEnvironmentVariables();
    
    // Проверяем конфигурацию
    const validatedConfig = validateConfig(config);
    
    log.info("System validation completed successfully");
    return validatedConfig;
  } catch (error) {
    log.error("System validation failed", { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
