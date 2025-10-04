import React from 'react';
import { OrderBook as OrderBookType } from '../types';

interface OrderBookProps {
  orderBook: OrderBookType | null;
  maxVolume: number;
  onPriceClick: (price: number) => void;
}

export const OrderBook: React.FC<OrderBookProps> = ({ orderBook, maxVolume, onPriceClick }) => {
  if (!orderBook) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-center text-gray-400">Loading order book...</div>
      </div>
    );
  }

  const formatPrice = (price: number) => price.toFixed(4);
  const formatAmount = (amount: number) => amount.toFixed(6);

  const getVolumeBarWidth = (amount: number) => {
    return maxVolume > 0 ? (amount / maxVolume) * 100 : 0;
  };

  const bestBid = orderBook.bids.length > 0 ? orderBook.bids[0].price : 0;
  const bestAsk = orderBook.asks.length > 0 ? orderBook.asks[0].price : 0;
  const spread = bestAsk - bestBid;
  const spreadPercent = bestAsk > 0 ? (spread / bestAsk) * 100 : 0;
  const midPrice = (bestBid + bestAsk) / 2;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header with spread info */}
      <div className="grid grid-cols-2 bg-gray-700 px-4 py-2 text-sm font-medium">
        <div className="text-ask">Asks</div>
        <div className="text-bid">Bids</div>
      </div>
      
      {/* Spread and mid price info */}
      <div className="bg-gray-700/50 px-4 py-2 text-xs text-gray-300 border-b border-gray-600">
        <div className="flex justify-between items-center">
          <span>Spread: {spread.toFixed(4)} ({spreadPercent.toFixed(2)}%)</span>
          <span className="text-yellow-400 font-medium">Mid: {midPrice.toFixed(4)}</span>
        </div>
      </div>
      
      {/* Column headers */}
      <div className="grid grid-cols-2 bg-gray-700 px-4 py-1 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Price</span>
          <span>Amount</span>
        </div>
        <div className="flex justify-between">
          <span>Amount</span>
          <span>Price</span>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {/* Asks (Red) */}
        <div className="border-r border-gray-700">
          {orderBook.asks.map((ask, index) => (
            <div
              key={`ask-${ask.price}-${index}`}
              className="orderbook-row relative group"
              onClick={() => onPriceClick(ask.price)}
            >
              <div className="volume-bar ask-volume-bar" style={{ width: `${getVolumeBarWidth(ask.amount)}%` }} />
              <div className="flex justify-between w-full relative z-10">
                <span className="orderbook-price text-ask group-hover:text-red-300">
                  {formatPrice(ask.price)}
                </span>
                <span className="orderbook-amount">
                  {formatAmount(ask.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bids (Green) */}
        <div>
          {orderBook.bids.map((bid, index) => (
            <div
              key={`bid-${bid.price}-${index}`}
              className="orderbook-row relative group"
              onClick={() => onPriceClick(bid.price)}
            >
              <div className="volume-bar bid-volume-bar" style={{ width: `${getVolumeBarWidth(bid.amount)}%` }} />
              <div className="flex justify-between w-full relative z-10">
                <span className="orderbook-amount">
                  {formatAmount(bid.amount)}
                </span>
                <span className="orderbook-price text-bid group-hover:text-green-300">
                  {formatPrice(bid.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick action buttons */}
      <div className="bg-gray-700/30 p-3 border-t border-gray-600">
        <div className="flex gap-2">
          <button
            className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
            onClick={() => onPriceClick(bestBid)}
          >
            Buy @ {bestBid.toFixed(4)}
          </button>
          <button
            className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
            onClick={() => onPriceClick(bestAsk)}
          >
            Sell @ {bestAsk.toFixed(4)}
          </button>
        </div>
      </div>
    </div>
  );
};
