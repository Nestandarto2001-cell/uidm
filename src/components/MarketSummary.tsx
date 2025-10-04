import React from 'react';
import { MarketSummary as MarketSummaryType } from '../types';

interface MarketSummaryProps {
  summary: MarketSummaryType | null;
  isConnected: boolean;
  symbol: string;
}

export const MarketSummary: React.FC<MarketSummaryProps> = ({ summary, isConnected, symbol }) => {
  if (!summary) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{symbol}</div>
          <div className={`px-2 py-1 rounded text-xs ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="text-gray-400 text-sm mt-2">Loading market data...</div>
      </div>
    );
  }

  const formatPrice = (price: number) => price.toFixed(4);
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{symbol}</div>
          <div className={`px-2 py-1 rounded text-xs ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Best Bid</div>
          <div className="text-bid font-mono">{formatPrice(summary.bestBid)}</div>
        </div>
        
        <div>
          <div className="text-gray-400">Best Ask</div>
          <div className="text-ask font-mono">{formatPrice(summary.bestAsk)}</div>
        </div>
        
        <div>
          <div className="text-gray-400">Spread</div>
          <div className="font-mono">
            {formatPrice(summary.spread)} ({formatPercent(summary.spreadPercent)})
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">24h Change</div>
          <div className={`font-mono ${summary.change24hPercent >= 0 ? 'text-bid' : 'text-ask'}`}>
            {formatPercent(summary.change24hPercent)}
          </div>
        </div>
      </div>
    </div>
  );
};
