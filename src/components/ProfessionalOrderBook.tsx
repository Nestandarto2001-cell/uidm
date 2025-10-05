import React, { useState, useEffect } from 'react';
import { OrderBook as OrderBookType } from '../types';
// import { OrderBookHeader } from './OrderBookHeader'; // Removed for optimization

interface ProfessionalOrderBookProps {
  orderBook: OrderBookType | null;
  maxVolume: number;
  onPriceClick: (price: number) => void;
  symbol?: string;
}

interface OrderBookRow {
  price: number;
  amount: number;
  total: number;
  percentage: number;
  isHighlighted?: boolean;
}

export const ProfessionalOrderBook: React.FC<ProfessionalOrderBookProps> = ({ 
  orderBook, 
  maxVolume, 
  onPriceClick,
  symbol = 'BTC/USDT'
}) => {
  const [spread, setSpread] = useState(0);
  const [midPrice, setMidPrice] = useState(0);
  const [asksRows, setAsksRows] = useState<OrderBookRow[]>([]);
  const [bidsRows, setBidsRows] = useState<OrderBookRow[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) {
      return;
    }

    const bestBid = orderBook.bids[0].price;
    const bestAsk = orderBook.asks[0].price;
    const currentSpread = bestAsk - bestBid;
    const currentMidPrice = (bestBid + bestAsk) / 2;

    setSpread(currentSpread);
    setMidPrice(currentMidPrice);

    // Process asks (sell orders) - ascending price
    const processedAsks: OrderBookRow[] = [];
    let askTotal = 0;
    
    orderBook.asks
      .sort((a, b) => a.price - b.price)
      .slice(0, 15) // Show top 15 asks
      .forEach((ask) => {
        askTotal += ask.amount;
        const percentage = maxVolume > 0 ? (askTotal / maxVolume) * 100 : 0;
        processedAsks.push({
          price: ask.price,
          amount: ask.amount,
          total: askTotal,
          percentage: Math.min(percentage, 100)
        });
      });

    // Process bids (buy orders) - descending price
    const processedBids: OrderBookRow[] = [];
    let bidTotal = 0;
    
    orderBook.bids
      .sort((a, b) => b.price - a.price)
      .slice(0, 15) // Show top 15 bids
      .forEach((bid) => {
        bidTotal += bid.amount;
        const percentage = maxVolume > 0 ? (bidTotal / maxVolume) * 100 : 0;
        processedBids.push({
          price: bid.price,
          amount: bid.amount,
          total: bidTotal,
          percentage: Math.min(percentage, 100)
        });
      });

    setAsksRows(processedAsks);
    setBidsRows(processedBids);
  }, [orderBook, maxVolume]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.01) return price.toFixed(6);
    return price.toFixed(8);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000) return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (amount >= 1) return amount.toFixed(4);
    if (amount >= 0.01) return amount.toFixed(6);
    return amount.toFixed(8);
  };

  const handleRowClick = (price: number) => {
    setSelectedPrice(price);
    onPriceClick(price);
  };

  const getRowClassName = (price: number, isAsk: boolean) => {
    const baseClass = "relative cursor-pointer transition-all duration-150 hover:bg-opacity-20";
    const priceClass = isAsk ? "hover:bg-red-500" : "hover:bg-green-500";
    const selectedClass = selectedPrice === price ? "bg-blue-500 bg-opacity-30" : "";
    
    return `${baseClass} ${priceClass} ${selectedClass}`;
  };

  const getVolumeBarColor = (isAsk: boolean, percentage: number) => {
    if (isAsk) {
      return `rgba(239, 68, 68, ${0.1 + (percentage / 100) * 0.3})`; // Red with opacity
    } else {
      return `rgba(34, 197, 94, ${0.1 + (percentage / 100) * 0.3})`; // Green with opacity
    }
  };

  if (!orderBook) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 h-96 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mb-2"></div>
          <div>Загрузка стакана...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      {/* <OrderBookHeader symbol={symbol} /> */} {/* Removed for optimization */}
      
      {/* Price Info */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-gray-300">
            <span className="text-red-400">Ask: </span>
            <span className="text-white">{formatPrice(orderBook.asks[0]?.price || 0)}</span>
          </div>
          <div className="text-gray-300">
            <span className="text-green-400">Bid: </span>
            <span className="text-white">{formatPrice(orderBook.bids[0]?.price || 0)}</span>
          </div>
          <div className="text-gray-300">
            <span className="text-yellow-400">Spread: </span>
            <span className="text-white">{formatPrice(spread)}</span>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="grid grid-cols-4 gap-4 text-xs text-gray-400">
          <div className="text-left">Цена</div>
          <div className="text-right">Объем</div>
          <div className="text-right">Сумма</div>
          <div className="text-right">%</div>
        </div>
      </div>

      <div className="h-80 overflow-y-auto">
        {/* Asks (Sell Orders) */}
        <div className="space-y-0">
          {asksRows.map((row, index) => (
            <div
              key={`ask-${row.price}-${index}`}
              className={getRowClassName(row.price, true)}
              onClick={() => handleRowClick(row.price)}
            >
              <div 
                className="absolute inset-y-0 right-0 transition-all duration-200"
                style={{
                  backgroundColor: getVolumeBarColor(true, row.percentage),
                  width: `${row.percentage}%`
                }}
              />
              <div className="relative grid grid-cols-4 gap-4 px-4 py-1 text-sm">
                <div className="text-left text-red-400 font-mono">{formatPrice(row.price)}</div>
                <div className="text-right text-white font-mono">{formatAmount(row.amount)}</div>
                <div className="text-right text-gray-300 font-mono">{formatAmount(row.total)}</div>
                <div className="text-right text-gray-400 text-xs">{row.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mid Price Separator */}
        <div className="bg-gray-800 border-t border-b border-gray-600 px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="text-yellow-400 font-semibold">Mid: {formatPrice(midPrice)}</div>
            <div className="text-gray-400 text-xs">
              Spread: {formatPrice(spread)} ({((spread / midPrice) * 100).toFixed(4)}%)
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="space-y-0">
          {bidsRows.map((row, index) => (
            <div
              key={`bid-${row.price}-${index}`}
              className={getRowClassName(row.price, false)}
              onClick={() => handleRowClick(row.price)}
            >
              <div 
                className="absolute inset-y-0 right-0 transition-all duration-200"
                style={{
                  backgroundColor: getVolumeBarColor(false, row.percentage),
                  width: `${row.percentage}%`
                }}
              />
              <div className="relative grid grid-cols-4 gap-4 px-4 py-1 text-sm">
                <div className="text-left text-green-400 font-mono">{formatPrice(row.price)}</div>
                <div className="text-right text-white font-mono">{formatAmount(row.amount)}</div>
                <div className="text-right text-gray-300 font-mono">{formatAmount(row.total)}</div>
                <div className="text-right text-gray-400 text-xs">{row.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 border-t border-gray-700 p-3">
        <div className="flex gap-2">
          <button
            className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
            onClick={() => handleRowClick(orderBook.bids[0]?.price || 0)}
          >
            Buy @ {formatPrice(orderBook.bids[0]?.price || 0)}
          </button>
          <button
            className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
            onClick={() => handleRowClick(orderBook.asks[0]?.price || 0)}
          >
            Sell @ {formatPrice(orderBook.asks[0]?.price || 0)}
          </button>
        </div>
      </div>
    </div>
  );
};
