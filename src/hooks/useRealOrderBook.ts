import { useState, useEffect, useCallback } from 'react';
import { getMexcApiService, setMexcApiService } from '../services/mexcApi';
import { OrderBookData } from '../types';

export const useRealOrderBook = (symbol: string, apiKey?: string, apiSecret?: string) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchOrderBook = useCallback(async () => {
    if (!apiKey || !apiSecret) {
      setError('API не настроен');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiService = getMexcApiService() || setMexcApiService(apiKey, apiSecret);
      const mexcOrderBook = await apiService.getOrderBook(symbol);
      
      // Конвертируем в формат приложения
      const orderBookData: OrderBookData = {
        bids: mexcOrderBook.bids.map(([price, amount]) => [parseFloat(price), parseFloat(amount)]),
        asks: mexcOrderBook.asks.map(([price, amount]) => [parseFloat(price), parseFloat(amount)])
      };

      setOrderBook(orderBookData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка получения ордербука');
      console.error('Order book fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, apiKey, apiSecret]);

  useEffect(() => {
    if (apiKey && apiSecret) {
      fetchOrderBook();
      
      // Обновляем каждые 2 секунды (частота как у реальных торговых терминалов)
      const interval = setInterval(fetchOrderBook, 2000);
      
      return () => clearInterval(interval);
    }
  }, [fetchOrderBook]);

  return {
    orderBook,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchOrderBook
  };
};
