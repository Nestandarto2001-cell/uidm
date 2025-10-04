import React from 'react';
import { useFavorites } from '../hooks/useFavorites';

interface OrderBookHeaderProps {
  symbol: string;
}

export const OrderBookHeader: React.FC<OrderBookHeaderProps> = ({ symbol }) => {
  const { toggle, has } = useFavorites();

  const handleStarClick = () => {
    toggle(symbol);
  };

  const isFavorite = has(symbol);

  return (
    <div className="bg-slate-800/60 px-4 py-3 border-b border-slate-600/50">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          {symbol}
          <button
            onClick={handleStarClick}
            className="text-yellow-400 hover:text-yellow-300 transition-colors text-lg"
            title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </h3>
      </div>
    </div>
  );
};
