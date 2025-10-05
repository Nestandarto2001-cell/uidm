import React, { useState, useEffect } from 'react';
import Tooltip from './SimpleTooltip';
import { getMexcApiService, setMexcApiService, MexcBalance } from '../services/mexcApi';

interface Balance {
  asset: string;
  free: string;
  locked: string;
  total: string;
}

interface BalanceDisplayProps {
  apiKey?: string;
  apiSecret?: string;
  symbol?: string;
  isApiConfigured: boolean;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  apiKey,
  apiSecret,
  symbol = 'USDT',
  isApiConfigured
}) => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchBalances = async () => {
    if (!isApiConfigured || !apiKey || !apiSecret) {
      setError('API не настроен - выберите профиль с API ключами');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Инициализируем API сервис
      const apiService = setMexcApiService(apiKey, apiSecret);
      
      // Сначала проверяем валидность API ключей
      console.log('🔍 Проверяем валидность API ключей для профиля...');
      const isValid = await apiService.validateApiKeys();
      
      if (!isValid) {
        throw new Error('API ключи недействительны');
      }
      
      console.log('✅ API ключи валидны, получаем баланс...');
      
      // Получаем баланс через API
      const mexcBalances = await apiService.getAccountBalance();
      
      // Конвертируем в формат компонента
      const convertedBalances: Balance[] = mexcBalances.map((balance: MexcBalance) => ({
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked,
        total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString()
      }));

      setBalances(convertedBalances);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка получения баланса');
      console.error('Balance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isApiConfigured) {
      fetchBalances();
      // Обновляем баланс каждые 30 секунд
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [isApiConfigured, apiKey, apiSecret]);

  const formatBalance = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (num >= 1) {
      return num.toFixed(4);
    } else {
      return num.toFixed(8);
    }
  };

  const getTotalUSDTValue = () => {
    // Моковая функция для расчета общей стоимости в USDT
    const usdtBalance = balances.find(b => b.asset === 'USDT');
    const btcBalance = balances.find(b => b.asset === 'BTC');
    const ethBalance = balances.find(b => b.asset === 'ETH');
    
    let total = parseFloat(usdtBalance?.total || '0');
    // Добавляем примерную стоимость BTC и ETH
    if (btcBalance) total += parseFloat(btcBalance.total) * 50000;
    if (ethBalance) total += parseFloat(ethBalance.total) * 3000;
    
    return total;
  };

  if (!isApiConfigured) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Баланс аккаунта</h3>
          <Tooltip text="Настройте API ключи для отображения баланса">
            <span className="text-gray-400 text-sm">❓</span>
          </Tooltip>
        </div>
        <div className="text-center text-gray-400 py-4">
          API не настроен
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Баланс аккаунта</h3>
        <div className="flex items-center space-x-2">
          <Tooltip text="Обновить баланс">
            <button
              onClick={fetchBalances}
              disabled={isLoading}
              className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 transition-colors"
            >
              {isLoading ? '⏳' : '🔄'}
            </button>
          </Tooltip>
          <Tooltip text="Общий баланс в USDT">
            <span className="text-green-400 font-medium text-sm">
              ≈ ${formatBalance(getTotalUSDTValue().toString())} USDT
            </span>
          </Tooltip>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-600/30 rounded p-2 mb-3">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-4">
          <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <span className="ml-2">Загрузка баланса...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {balances.map((balance) => (
            <div key={balance.asset} className="flex justify-between items-center py-2 px-3 bg-gray-700/50 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">{balance.asset}</span>
                <Tooltip text={`Заблокировано: ${balance.locked} ${balance.asset}`}>
                  <span className="text-gray-400 text-xs">
                    {parseFloat(balance.locked) > 0 ? '🔒' : '✅'}
                  </span>
                </Tooltip>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">
                  {formatBalance(balance.total)} {balance.asset}
                </div>
                {parseFloat(balance.locked) > 0 && (
                  <div className="text-gray-400 text-xs">
                    Доступно: {formatBalance(balance.free)}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {lastUpdate && (
            <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
              Обновлено: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
