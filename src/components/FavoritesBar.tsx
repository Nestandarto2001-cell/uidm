import React from 'react';
import { useFavorites } from '../hooks/useFavorites';

interface FavoritesBarProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

export const FavoritesBar: React.FC<FavoritesBarProps> = ({
  currentSymbol,
  onSymbolChange
}) => {
  const { list: favorites, remove } = useFavorites();

  const handleRemoveFavorite = (symbol: string) => {
    remove(symbol);
  };

  if (favorites.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-600/50 p-3">
        <div className="text-slate-400 text-xs">
          Избранное пусто. Добавьте тикеры звездочкой в ордербуке.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-600/50 p-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-slate-300 text-xs font-medium flex-shrink-0">Избранное:</span>
        {favorites.map((symbol) => (
          <div
            key={symbol}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs flex-shrink-0 hover:bg-blue-700 transition-colors cursor-pointer"
            onClick={() => onSymbolChange(symbol)}
          >
            <span className={currentSymbol === symbol ? 'font-bold' : ''}>
              {symbol}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(symbol);
              }}
              className="text-gray-300 hover:text-white ml-1"
              title="Удалить из избранного"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
