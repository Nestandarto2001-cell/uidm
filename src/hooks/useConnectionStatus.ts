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
    // Проверяем статус расширения и API
    const checkStatus = async () => {
      try {
        const bridgeReady = extIsReady();
        let extState: ExtState = 'disconnected';
        let apiState: ApiState | undefined = undefined;

        if (bridgeReady) {
          // Проверяем ping
          const pingResult = await ping();
          if (pingResult) {
            extState = 'live';
            
            // Проверяем API
            const probeResult = await probe();
            if (probeResult.type === 'PROBE_OK') {
              apiState = 'connected';
            } else {
              apiState = 'disconnected';
            }
          } else {
            extState = 'degraded';
          }
        }

        setStatus(prev => ({
          ...prev,
          extState,
          apiState,
          obFresh: extState === 'live' && apiState === 'connected'
        }));
      } catch (error) {
        console.error('[useConnectionStatus] Error checking status:', error);
        setStatus(prev => ({
          ...prev,
          extState: 'disconnected',
          apiState: 'disconnected',
          obFresh: false
        }));
      }
    };

    // Проверяем сразу
    checkStatus();

    // Проверяем каждые 10 секунд
    const interval = setInterval(checkStatus, 10000);

    // Слушаем сообщения от расширения
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === 'MEXC_TT') {
        if (event.data.type === 'EXT_READY') {
          checkStatus();
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Проверяем, нужно ли дизейблить отправку ордеров
  const isStale = status.extState === 'disconnected' || status.apiState === 'disconnected';

  return {
    ...status,
    isStale,
    shouldDisableOrders: isStale,
    freshUpdatesCount
  };
}
