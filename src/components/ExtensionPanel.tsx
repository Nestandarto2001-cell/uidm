import React, { useState, useEffect } from 'react';
import { bridgeSend, request } from '../bridge';
import { Tooltip } from './Tooltip';

// Простая заглушка для chrome API
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (message: any) => Promise<any>;
      };
    };
  }
}

const chrome = typeof window !== 'undefined' ? window.chrome : undefined;

interface ExtensionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtensionMetrics {
  ports: {
    mexc: boolean;
    terminal: boolean;
  };
  lastHeartbeat: Date | null;
  lastOrderBook: Date | null;
  messageStats: {
    incoming: number;
    outgoing: number;
    msgsPerSec: string;
  };
  asksLength: number;
  bidsLength: number;
  currentSymbol: string;
  activeUrl: string;
  errors: Array<{
    message: string;
    timestamp: number;
  }>;
  stale: boolean;
  pingTime?: number;
}

export const ExtensionPanel: React.FC<ExtensionPanelProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<ExtensionMetrics>({
    ports: { mexc: false, terminal: false },
    lastHeartbeat: null,
    lastOrderBook: null,
    messageStats: { incoming: 0, outgoing: 0, msgsPerSec: '0.0' },
    asksLength: 0,
    bidsLength: 0,
    currentSymbol: '',
    activeUrl: '',
    errors: [],
    stale: true,
    pingTime: undefined
  });

  const [pinging, setPinging] = useState(false);

  const fetchExtensionStatus = async () => {
    try {
      // Запрос статуса у расширения через bridge
      try {
        const response = await request({ type: 'DEBUG_DUMP' }, 'DEBUG_DUMP_RESPONSE', 5000);
        if (response?.payload) {
          const data = response.payload;
          setMetrics(prev => ({
            ...prev,
            ports: data.ports,
            lastHeartbeat: data.lastHeartbeat ? new Date(data.lastHeartbeat) : null,
            lastOrderBook: data.lastOrderBook ? new Date(data.lastOrderBook) : null,
            messageStats: data.messageStats,
            errors: data.errors || [],
            stale: false
          }));
        }
      } catch (error) {
        console.error('Failed to get extension status:', error);
      }
    } catch (error) {
      console.error('Failed to get extension status:', error);
    }
  };

  const handlePing = async () => {
    if (pinging) return;
    
    setPinging(true);
    const startTime = Date.now();
    
    try {
      const response = await request({ type: 'PING' }, 'PONG', 3000);
      if (response) {
        const pingTime = Date.now() - startTime;
        setMetrics(prev => ({
          ...prev,
          pingTime
        }));
      }
    } catch (error) {
      console.error('Ping failed:', error);
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Первоначальная загрузка статуса
    fetchExtensionStatus();

    // Обновляем статус каждую секунду
    const interval = setInterval(fetchExtensionStatus, 1000);

    // Слушаем сообщения от расширения
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'MEXC_ORDERBOOK_DATA') {
        setMetrics(prev => ({
          ...prev,
          lastOrderBook: new Date(),
          asksLength: event.data.payload.asks?.length || 0,
          bidsLength: event.data.payload.bids?.length || 0,
          currentSymbol: event.data.payload.symbol || '',
          activeUrl: event.data.payload.url || '',
          stale: false
        }));
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen]);

  const getPortStatusColor = (connected: boolean) => {
    return connected ? 'bg-green-500' : 'bg-red-500';
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Никогда';
    const now = Date.now();
    const age = Math.floor((now - date.getTime()) / 1000);
    return `${date.toLocaleTimeString()} (${age}s ago)`;
  };

  const formatAge = (date: Date | null) => {
    if (!date) return 'Never';
    const age = Math.floor((Date.now() - date.getTime()) / 1000);
    return `${age}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800/60 border border-slate-600/50 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600/50">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-200">Телеметрия расширения</h2>
            <Tooltip content="Мост из страницы MEXC → терминал. Нужен для оценочной зоны" position="bottom">
              <span className="text-slate-400 text-sm cursor-help">?</span>
            </Tooltip>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Port Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 text-sm">EXT Port:</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 ${getPortStatusColor(metrics.ports.mexc)}`}></div>
                <span className="text-slate-200 text-sm font-medium">
                  {metrics.ports.mexc ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-slate-300 text-sm">Terminal Port:</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 ${getPortStatusColor(metrics.ports.terminal)}`}></div>
                <span className="text-slate-200 text-sm font-medium">
                  {metrics.ports.terminal ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Last Heartbeat */}
          <div className="flex justify-between">
            <span className="text-slate-300 text-sm">Last heartbeat:</span>
            <span className="text-slate-200 text-sm">{formatTime(metrics.lastHeartbeat)}</span>
          </div>

          {/* Last OrderBook */}
          <div className="flex justify-between">
            <span className="text-slate-300 text-sm">Last ORDERBOOK:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-200 text-sm">{formatTime(metrics.lastOrderBook)}</span>
              {metrics.stale && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs">STALE</span>
              )}
            </div>
          </div>

          {/* Messages per second */}
          <div className="flex justify-between">
            <span className="text-slate-300 text-sm">Msgs/sec:</span>
            <span className="text-slate-200 text-sm">{metrics.messageStats.msgsPerSec}</span>
          </div>

          {/* Data sizes */}
          <div className="flex justify-between">
            <span className="text-slate-300 text-sm">Data sizes:</span>
            <span className="text-slate-200 text-sm">
              Asks: {metrics.asksLength}, Bids: {metrics.bidsLength}
            </span>
          </div>

          {/* Current Symbol */}
          <div className="flex justify-between">
            <span className="text-slate-300 text-sm">Current symbol:</span>
            <span className="text-slate-200 text-sm">{metrics.currentSymbol || 'Unknown'}</span>
          </div>

          {/* Active URL */}
          <div className="flex justify-between">
            <span className="text-slate-300 text-sm">Active URL:</span>
            <span className="text-slate-200 text-sm truncate max-w-48" title={metrics.activeUrl}>
              {metrics.activeUrl || 'Unknown'}
            </span>
          </div>

          {/* Ping Test */}
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">Ping test:</span>
            <div className="flex items-center gap-2">
              {metrics.pingTime && (
                <span className="text-slate-200 text-sm">{metrics.pingTime}ms</span>
              )}
              <button
                onClick={handlePing}
                disabled={pinging}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs transition-colors"
              >
                {pinging ? 'Pinging...' : 'Ping'}
              </button>
            </div>
          </div>

          {/* Last Errors */}
          {metrics.errors.length > 0 && (
            <div>
              <span className="text-red-300 text-sm">Last errors:</span>
              <div className="mt-1 space-y-1">
                {metrics.errors.slice(-3).map((error, index) => (
                  <div key={index} className="text-red-200 text-xs">
                    {new Date(error.timestamp).toLocaleTimeString()}: {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-600/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
