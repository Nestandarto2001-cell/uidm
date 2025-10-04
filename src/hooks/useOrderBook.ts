import { useState, useEffect, useMemo } from 'react';
import { OrderBookData, OrderBook, MarketSummary } from '../types';

export const useOrderBook = (data: OrderBookData | null) => {
  const [previousData, setPreviousData] = useState<OrderBookData | null>(null);

  const processedOrderBook = useMemo((): OrderBook | null => {
    if (!data) return null;

    const bids: { price: number; amount: number }[] = data.bids
      .map(([price, amount]) => ({ price, amount }))
      .sort((a, b) => b.price - a.price) // Sort bids descending
      .slice(0, 20); // Show top 20

    const asks: { price: number; amount: number }[] = data.asks
      .map(([price, amount]) => ({ price, amount }))
      .sort((a, b) => a.price - b.price) // Sort asks ascending
      .slice(0, 20); // Show top 20

    return { bids, asks };
  }, [data]);

  const marketSummary = useMemo((): MarketSummary | null => {
    if (!processedOrderBook || processedOrderBook.bids.length === 0 || processedOrderBook.asks.length === 0) {
      return null;
    }

    const bestBid = processedOrderBook.bids[0].price;
    const bestAsk = processedOrderBook.asks[0].price;
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / bestBid) * 100;
    const midPrice = (bestBid + bestAsk) / 2;

    // Calculate 24h change (mock data for now)
    const change24h = midPrice * 0.02; // 2% change
    const change24hPercent = 2.0;
    const volume24h = processedOrderBook.bids.reduce((sum, bid) => sum + bid.amount, 0) +
                     processedOrderBook.asks.reduce((sum, ask) => sum + ask.amount, 0);

    return {
      symbol: 'YNE/USDT',
      bestBid,
      bestAsk,
      spread,
      spreadPercent,
      change24h,
      change24hPercent,
      volume24h,
    };
  }, [processedOrderBook]);

  const maxVolume = useMemo(() => {
    if (!processedOrderBook) return 0;
    
    const allVolumes = [
      ...processedOrderBook.bids.map(bid => bid.amount),
      ...processedOrderBook.asks.map(ask => ask.amount)
    ];
    
    return Math.max(...allVolumes);
  }, [processedOrderBook]);

  // Track changes for animations
  useEffect(() => {
    if (data && previousData) {
      // You can add change detection logic here for animations
    }
    setPreviousData(data);
  }, [data, previousData]);

  return {
    orderBook: processedOrderBook,
    marketSummary,
    maxVolume,
    hasData: !!processedOrderBook,
  };
};
