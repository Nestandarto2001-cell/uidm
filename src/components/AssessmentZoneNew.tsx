/**
 * Assessment Zone - полноценный скринер монет
 * Два режима: Список монет и Графики
 */

import React, { useState, useEffect } from 'react';
import { getSymbols, getTicker } from '../extBridge';
import Tooltip from './SimpleTooltip';

interface CoinData {
  symbol: string;
  price: number;
  volume24h: number;
  volatility: number;
  liquidity: number;
  isFavorite: boolean;
  change24h: number;
}

interface AssessmentZoneProps {
  onSymbolSelect: (symbol: string) => void;
}

export const AssessmentZone: React.FC<AssessmentZoneProps> = ({ onSymbolSelect }) => {
  const [mode, setMode] = useState<'list' | 'charts'>('list');
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Фильтры
  const [minVolume, setMinVolume] = useState(1000000); // 1M USDT
  const [minVolatility, setMinVolatility] = useState(0.01); // 1%
  const [minLiquidity, setMinLiquidity] = useState(100000); // 100K USDT
  const [showFutures, setShowFutures] = useState(false);

  // Загрузка данных
  const loadCoins = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Получаем список символов через extBridge
      const symbols = await getSymbols();
      
      // Фильтруем только USDT пары
      const usdtPairs = symbols
        .filter((s: any) => s.symbol.endsWith('USDT') && s.status === 'TRADING')
        .slice(0, 50); // Ограничиваем для производительности
      
      const coinsData: CoinData[] = [];
      
      // Получаем данные для каждого символа
      for (const symbol of usdtPairs) {
        try {
          const ticker = await getTicker(symbol.symbol);
          
          // Вычисляем волатильность (простое приближение)
          const volatility = Math.abs(parseFloat(ticker.priceChangePercent) / 100);
          
          // Вычисляем ликвидность (объем * цену)
          const liquidity = parseFloat(ticker.volume) * parseFloat(ticker.lastPrice);
          
          coinsData.push({
            symbol: symbol.symbol,
            price: parseFloat(ticker.lastPrice),
            volume24h: parseFloat(ticker.volume),
            volatility,
            liquidity,
            isFavorite: favorites.has(symbol.symbol),
            change24h: parseFloat(ticker.priceChangePercent)
          });
        } catch (err) {
          console.warn(`Failed to load data for ${symbol.symbol}:`, err);
        }
      }
      
      setCoins(coinsData);
    } catch (err) {
      setError('Ошибка загрузки данных: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoins();
  }, []);

  // Переключение избранного
  const toggleFavorite = (symbol: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(symbol)) {
      newFavorites.delete(symbol);
    } else {
      newFavorites.add(symbol);
    }
    setFavorites(newFavorites);
    
    // Обновляем данные
    setCoins(prev => prev.map(coin => 
      coin.symbol === symbol 
        ? { ...coin, isFavorite: newFavorites.has(symbol) }
        : coin
    ));
  };

  // Фильтрация данных
  const filteredCoins = coins.filter(coin => {
    if (coin.volume24h < minVolume) return false;
    if (coin.volatility < minVolatility) return false;
    if (coin.liquidity < minLiquidity) return false;
    if (!showFutures && coin.symbol.includes('_')) return false; // Простые пары
    return true;
  }).sort((a, b) => b.volume24h - a.volume24h);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(8);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Заголовок и переключатель режимов */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Оценочная зона</h2>
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'list'
                  ? 'bg-white text-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setMode('charts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'charts'
                  ? 'bg-white text-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Графики
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Объем 24h (мин)</label>
            <input
              type="number"
              value={minVolume}
              onChange={(e) => setMinVolume(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm"
              placeholder="1000000"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Волатильность (мин)</label>
            <input
              type="number"
              step="0.01"
              value={minVolatility}
              onChange={(e) => setMinVolatility(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm"
              placeholder="0.01"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Ликвидность (мин)</label>
            <input
              type="number"
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm"
              placeholder="100000"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center text-sm text-slate-300">
              <input
                type="checkbox"
                checked={showFutures}
                onChange={(e) => setShowFutures(e.target.checked)}
                className="mr-2"
              />
              Фьючерсы
            </label>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-hidden">
        {mode === 'list' ? (
          /* Режим списка */
          <div className="h-full overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Загрузка данных...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-400">{error}</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300">Тикер</th>
                      <th className="px-4 py-3 text-right text-slate-300">Цена</th>
                      <th className="px-4 py-3 text-right text-slate-300">Объем 24h</th>
                      <th className="px-4 py-3 text-right text-slate-300">Волатильность</th>
                      <th className="px-4 py-3 text-right text-slate-300">Ликвидность</th>
                      <th className="px-4 py-3 text-center text-slate-300">Избранное</th>
                      <th className="px-4 py-3 text-center text-slate-300">Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoins.map((coin) => (
                      <tr
                        key={coin.symbol}
                        className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-medium">{coin.symbol}</td>
                        <td className="px-4 py-3 text-right text-white">${formatPrice(coin.price)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{formatNumber(coin.volume24h)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`${coin.volatility > 0.05 ? 'text-red-400' : 'text-slate-300'}`}>
                            {(coin.volatility * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{formatNumber(coin.liquidity)}</td>
                        <td className="px-4 py-3 text-center">
                          <Tooltip text={coin.isFavorite ? "Убрать из избранного" : "Добавить в избранное"}>
                            <button
                              onClick={() => toggleFavorite(coin.symbol)}
                              className={`text-xl transition-colors ${
                                coin.isFavorite ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'
                              }`}
                            >
                              {coin.isFavorite ? '★' : '☆'}
                            </button>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => onSymbolSelect(coin.symbol)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                          >
                            Открыть
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Режим графиков */
          <div className="h-full p-4">
            <div className="text-center text-slate-400">
              Режим графиков в разработке
              <br />
              <small>Будут добавлены компактные мини-чарты</small>
            </div>
          </div>
        )}
      </div>

      {/* Кнопка обновления */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={loadCoins}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-md transition-colors"
        >
          {isLoading ? 'Обновление...' : 'Обновить данные'}
        </button>
      </div>
    </div>
  );
};

export default AssessmentZone;
