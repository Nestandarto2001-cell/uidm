import { log } from './logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 503, true);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true);
  }
}

// Утилиты для обработки ошибок
export const errorHandler = {
  // Обработка ошибок с retry
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log.debug(`Attempting ${context}`, { attempt, maxRetries });
        const result = await operation();
        
        if (attempt > 1) {
          log.info(`${context} succeeded after retry`, { attempt });
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        log.warn(`${context} failed`, {
          attempt,
          maxRetries,
          error: lastError.message
        });
        
        if (attempt === maxRetries) {
          log.error(`${context} failed after all retries`, {
            attempts: maxRetries,
            error: lastError.message
          });
          break;
        }
        
        // Экспоненциальная задержка
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError!;
  },

  // Обработка таймаутов
  async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    context: string = 'operation'
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${context} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation, timeoutPromise]);
    } catch (error) {
      log.error(`${context} timeout`, {
        timeout: timeoutMs,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  // Обработка ошибок API
  handleApiError(error: any, context: string = 'API call'): never {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new NetworkError(`Network error in ${context}: ${error.message}`);
    }
    
    if (error.status === 401 || error.status === 403) {
      throw new AuthError(`Authentication error in ${context}: ${error.message}`);
    }
    
    if (error.status === 429) {
      throw new RateLimitError(`Rate limit exceeded in ${context}: ${error.message}`);
    }
    
    if (error.status >= 400 && error.status < 500) {
      throw new ValidationError(`Client error in ${context}: ${error.message}`);
    }
    
    if (error.status >= 500) {
      throw new NetworkError(`Server error in ${context}: ${error.message}`);
    }
    
    throw new AppError(`Unknown error in ${context}: ${error.message}`);
  },

  // Обработка ошибок браузера
  handleBrowserError(error: any, context: string = 'Browser operation'): never {
    if (error.message.includes('timeout')) {
      throw new AppError(`Browser timeout in ${context}: ${error.message}`, 408);
    }
    
    if (error.message.includes('not found') || error.message.includes('selector')) {
      throw new AppError(`Element not found in ${context}: ${error.message}`, 404);
    }
    
    if (error.message.includes('not authorized') || error.message.includes('auth')) {
      throw new AuthError(`Authentication error in ${context}: ${error.message}`);
    }
    
    throw new AppError(`Browser error in ${context}: ${error.message}`);
  },

  // Graceful shutdown
  async gracefulShutdown(signal: string, cleanup: () => Promise<void>) {
    log.info(`Received ${signal}, starting graceful shutdown`);
    
    try {
      await cleanup();
      log.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      log.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
      process.exit(1);
    }
  }
};

// Глобальный обработчик необработанных ошибок
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // Даем время для записи логов, затем завершаем процесс
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    promise: promise.toString()
  });
});
