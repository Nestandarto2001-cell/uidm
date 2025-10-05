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
      setError('API ключи не настроены. Перейдите в раздел "Подключение" для настройки.');
      return;
    }

    // Проверяем валидность API ключей
    if (apiKey.length < 10 || apiSecret.length < 10) {
      setError('API ключи имеют неверный формат. Проверьте правильность ввода.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('[useRealOrderBook] Fetching order book for:', symbol, 'with API keys configured');
      const apiService = getMexcApiService() || setMexcApiService(apiKey, apiSecret);
      
      // Проверяем валидность API ключей
      console.log('[useRealOrderBook] Validating API keys...');
      const isValid = await apiService.validateApiKeys();
      
      if (!isValid) {
        throw new Error('API ключи недействительны');
      }
      
      console.log('[useRealOrderBook] API keys valid, fetching order book...');
      const mexcOrderBook = await apiService.getOrderBook(symbol);
      
      // Конвертируем в формат приложения
      const orderBookData: OrderBookData = {
        bids: mexcOrderBook.bids.map(([price, amount]) => [parseFloat(price), parseFloat(amount)]),
        asks: mexcOrderBook.asks.map(([price, amount]) => [parseFloat(price), parseFloat(amount)])
      };

      setOrderBook(orderBookData);
      setLastUpdate(new Date());
      console.log('[useRealOrderBook] Successfully fetched order book');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка получения ордербука';
      setError(`${errorMessage}. Проверьте правильность API ключей и доступ к MEXC API.`);
      console.error('[useRealOrderBook] Order book fetch error:', err);
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
