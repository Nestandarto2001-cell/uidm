import { useMemo } from 'react';
import { OrderBook, MarketSummary } from '../types';

export const useOrderBook = (orderBookData: any) => {
  const { orderBook, marketSummary, maxVolume } = useMemo(() => {
    if (!orderBookData) {
      return {
        orderBook: null,
        marketSummary: null,
        maxVolume: 0
      };
    }

    // Преобразуем данные в нужный формат
    let bids: Array<{ price: number; amount: number }> = [];
    let asks: Array<{ price: number; amount: number }> = [];

    if (orderBookData.bids && orderBookData.asks) {
      // Если данные уже в правильном формате
      bids = orderBookData.bids.map(([price, amount]: [number, number]) => ({
        price,
        amount
      }));
      asks = orderBookData.asks.map(([price, amount]: [number, number]) => ({
        price,
        amount
      }));
    }

    // Сортируем данные
    bids.sort((a, b) => b.price - a.price); // По убыванию цены
    asks.sort((a, b) => a.price - b.price); // По возрастанию цены

    // Вычисляем максимальный объем
    const allVolumes = [...bids, ...asks].map(item => item.amount);
    const maxVolume = Math.max(...allVolumes, 0);

    // Создаем сводку рынка
    const marketSummary: MarketSummary | null = bids.length > 0 && asks.length > 0 ? {
      symbol: 'BTC_USDT', // Можно передавать как параметр
      bestBid: bids[0].price,
      bestAsk: asks[0].price,
      spread: asks[0].price - bids[0].price,
      spreadPercent: ((asks[0].price - bids[0].price) / bids[0].price) * 100,
      change24h: 0, // Нужно получать из API
      change24hPercent: 0, // Нужно получать из API
      volume24h: 0 // Нужно получать из API
    } : null;

    const orderBook: OrderBook = {
      bids,
      asks
    };

    return {
      orderBook,
      marketSummary,
      maxVolume
    };
  }, [orderBookData]);

  return {
    orderBook,
    marketSummary,
    maxVolume
  };
};
