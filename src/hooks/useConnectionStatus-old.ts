import { useState, useEffect } from 'react';
import { extIsReady, probe, ping } from '../extBridge';

export type ExtState = 'live' | 'degraded' | 'disconnected';
export type ApiState = 'connected' | 'disconnected';

interface ConnectionStatus {
  extState: ExtState;
  obFresh: boolean;
  apiState?: ApiState;
  lastOrderBookTime: Date | null;
}

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    extState: 'disconnected',
    obFresh: false,
    apiState: undefined,
    lastOrderBookTime: null
  });

  const [freshUpdatesCount, setFreshUpdatesCount] = useState(0);

  useEffect(() => {
    // Слушаем сообщения от расширения
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'MEXC_ORDERBOOK_DATA') {
        const now = new Date();
        setStatus(prev => ({
          ...prev,
          extState: 'live',
          lastOrderBookTime: now,
          obFresh: true
        }));

        // Увеличиваем счетчик свежих обновлений
        setFreshUpdatesCount(prev => prev + 1);

        // Сброс флага свежести через 1.5 секунды
        setTimeout(() => {
          setStatus(prev => ({
            ...prev,
            obFresh: false
          }));
        }, 1500);
      }

      if (event.data.type === 'MEXC_HEARTBEAT') {
        setStatus(prev => ({
          ...prev,
          extState: 'live'
        }));
      }

      if (event.data.type === 'MEXC_API_STATUS') {
        setStatus(prev => ({
          ...prev,
          apiState: event.data.status
        }));
      }
    };

    window.addEventListener('message', handleMessage);

    // Проверяем localStorage для данных
    const checkLocalStorage = () => {
      const data = localStorage.getItem('mexc_orderbook_data');
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          const timestamp = new Date(parsedData.timestamp);
          const now = new Date();
          const diff = now.getTime() - timestamp.getTime();
          
          // Если данные свежие (меньше 1.5 секунд), увеличиваем счетчик
          if (diff < 1500) {
            setFreshUpdatesCount(prev => prev + 1);
          }
          
          setStatus(prev => ({
            ...prev,
            extState: diff < 5000 ? 'live' : 'degraded',
            lastOrderBookTime: timestamp,
            obFresh: diff < 1500
          }));
        } catch (e) {
          setStatus(prev => ({
            ...prev,
            extState: 'disconnected',
            obFresh: false
          }));
          setFreshUpdatesCount(0);
        }
      } else {
        setStatus(prev => ({
          ...prev,
          extState: 'disconnected',
          obFresh: false
        }));
        setFreshUpdatesCount(0);
      }
    };

    checkLocalStorage();
    const interval = setInterval(checkLocalStorage, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  // Проверяем, нужно ли дизейблить отправку ордеров
  const isStale = !status.obFresh || (status.lastOrderBookTime && (Date.now() - status.lastOrderBookTime.getTime()) > 1500);
  const shouldDisableOrders = isStale || status.extState === 'disconnected';

  return {
    ...status,
    isStale,
    shouldDisableOrders,
    freshUpdatesCount
  };
}
