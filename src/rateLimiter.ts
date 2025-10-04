import rateLimit from 'express-rate-limit';
import { log } from './logger';
import { CONFIG } from './config';

// Базовый rate limiter
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later.',
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      log.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// Rate limiter для API endpoints
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 минута
  max: 100, // максимум 100 запросов в минуту
  message: 'API rate limit exceeded. Maximum 100 requests per minute.'
});

// Rate limiter для health check endpoints
export const healthRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 минута
  max: 30, // максимум 30 запросов в минуту
  message: 'Health check rate limit exceeded. Maximum 30 requests per minute.'
});

// Rate limiter для WebSocket connections
export const wsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // максимум 10 подключений в минуту
  message: 'WebSocket connection rate limit exceeded. Maximum 10 connections per minute.'
});

// Rate limiter для торговых операций
export const tradingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 минута
  max: 20, // максимум 20 торговых операций в минуту
  message: 'Trading rate limit exceeded. Maximum 20 trades per minute.'
});

// Класс для управления rate limiting на уровне приложения
export class RateLimitManager {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private tradingCounts: Map<string, { count: number; resetTime: number }> = new Map();

  // Проверка лимита запросов для конкретного IP
  checkRequestLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `requests:${ip}`;
    const current = this.requestCounts.get(key);

    if (!current || now > current.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= limit) {
      log.warn('Request rate limit exceeded', { ip, count: current.count, limit });
      return false;
    }

    current.count++;
    return true;
  }

  // Проверка лимита торговых операций для конкретного IP
  checkTradingLimit(ip: string, limit: number = 20, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `trading:${ip}`;
    const current = this.tradingCounts.get(key);

    if (!current || now > current.resetTime) {
      this.tradingCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= limit) {
      log.warn('Trading rate limit exceeded', { ip, count: current.count, limit });
      return false;
    }

    current.count++;
    return true;
  }

  // Очистка устаревших записей
  cleanup() {
    const now = Date.now();
    
    for (const [key, value] of this.requestCounts.entries()) {
      if (now > value.resetTime) {
        this.requestCounts.delete(key);
      }
    }
    
    for (const [key, value] of this.tradingCounts.entries()) {
      if (now > value.resetTime) {
        this.tradingCounts.delete(key);
      }
    }
  }

  // Получение статистики
  getStats() {
    return {
      requestCounts: this.requestCounts.size,
      tradingCounts: this.tradingCounts.size,
      totalRequests: Array.from(this.requestCounts.values()).reduce((sum, curr) => sum + curr.count, 0),
      totalTrades: Array.from(this.tradingCounts.values()).reduce((sum, curr) => sum + curr.count, 0)
    };
  }
}

// Глобальный менеджер rate limiting
export const rateLimitManager = new RateLimitManager();

// Очистка каждые 5 минут
setInterval(() => {
  rateLimitManager.cleanup();
}, 5 * 60 * 1000);

// Middleware для проверки rate limit в WebSocket
export const wsRateLimitMiddleware = (ws: any, req: any) => {
  const ip = req.socket.remoteAddress || req.connection.remoteAddress || 'unknown';
  
  if (!rateLimitManager.checkRequestLimit(ip, 10, 60000)) {
    log.warn('WebSocket connection blocked by rate limit', { ip });
    ws.close(1008, 'Rate limit exceeded');
    return false;
  }
  
  return true;
};

// Middleware для проверки rate limit торговых операций
export const tradingRateLimitMiddleware = (ws: any, req: any) => {
  const ip = req.socket.remoteAddress || req.connection.remoteAddress || 'unknown';
  
  if (!rateLimitManager.checkTradingLimit(ip, 20, 60000)) {
    log.warn('Trading operation blocked by rate limit', { ip });
    ws.send(JSON.stringify({
      type: 'error',
      payload: 'Trading rate limit exceeded. Maximum 20 trades per minute.'
    }));
    return false;
  }
  
  return true;
};
