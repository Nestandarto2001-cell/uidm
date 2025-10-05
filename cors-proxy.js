// CORS Proxy для MEXC API
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = 3003;

// Включаем CORS для всех запросов
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-MEXC-APIKEY']
}));

// Прокси для MEXC API
app.use('/api/mexc', createProxyMiddleware({
  target: 'https://api.mexc.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/mexc': '/api/v3'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Проксируем запрос:', req.method, req.url);
    
    // Передаем все заголовки
    if (req.headers['x-mexc-apikey']) {
      proxyReq.setHeader('X-MEXC-APIKEY', req.headers['x-mexc-apikey']);
    }
    
    // Логируем заголовки для отладки
    console.log('📤 Заголовки запроса:', {
      'X-MEXC-APIKEY': req.headers['x-mexc-apikey'] ? '***' + req.headers['x-mexc-apikey'].slice(-4) : 'Нет',
      'Content-Type': req.headers['content-type'] || 'Нет'
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('📨 Ответ от MEXC API:', proxyRes.statusCode, proxyRes.statusMessage);
    
    // Добавляем CORS заголовки
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-MEXC-APIKEY';
  },
  onError: (err, req, res) => {
    console.error('❌ Ошибка прокси:', err.message);
    res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CORS Proxy работает' });
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy запущен на порту ${PORT}`);
  console.log(`📡 Проксирует запросы к MEXC API`);
  console.log(`🌐 Доступен по адресу: http://localhost:${PORT}`);
  console.log(`🔗 Используйте: http://localhost:${PORT}/api/mexc/...`);
});
