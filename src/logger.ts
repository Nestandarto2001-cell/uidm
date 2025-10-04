import winston from 'winston';
import path from 'path';

// Создаем директорию для логов
const logDir = 'logs';

// Конфигурация логгера
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mexc-trader' },
  transports: [
    // Логи ошибок в отдельный файл
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Все логи в общий файл
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// В режиме разработки также выводим в консоль
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
      })
    )
  }));
}

// Специальные методы для разных типов событий
export const log = {
  // Общие логи
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),

  // Специальные логи для торговли
  trade: (action: string, symbol: string, details: any) => {
    logger.info('Trade executed', {
      action,
      symbol,
      ...details,
      timestamp: new Date().toISOString()
    });
  },

  // Логи для API
  api: (method: string, endpoint: string, status: number, duration?: number) => {
    logger.info('API call', {
      method,
      endpoint,
      status,
      duration: duration ? `${duration}ms` : undefined
    });
  },

  // Логи для браузера
  browser: (action: string, details?: any) => {
    logger.info('Browser action', {
      action,
      ...details
    });
  },

  // Логи для авторизации
  auth: (status: 'success' | 'failed' | 'expired', details?: any) => {
    const level = status === 'success' ? 'info' : 'warn';
    logger[level]('Authentication', {
      status,
      ...details
    });
  },

  // Логи для мониторинга
  health: (component: string, status: 'healthy' | 'unhealthy', details?: any) => {
    const level = status === 'healthy' ? 'info' : 'error';
    logger[level]('Health check', {
      component,
      status,
      ...details
    });
  }
};

export default logger;
