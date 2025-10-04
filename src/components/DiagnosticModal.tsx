/**
 * Diagnostic Modal Component
 * Модальное окно диагностики для отображения статуса подключения и ошибок
 */

import React, { useState, useEffect } from 'react';
import { extIsReady, probe, ping } from '../extBridge';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DiagnosticRow {
  k: string;
  v: string;
  s?: 'ok' | 'err' | 'warn';
}

const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ isOpen, onClose }) => {
  const [rows, setRows] = useState<DiagnosticRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [heartbeatStatus, setHeartbeatStatus] = useState<'waiting' | 'connected' | 'disconnected'>('waiting');

  const runDiagnostic = async () => {
    setIsLoading(true);
    const r: DiagnosticRow[] = [];

    try {
      // Браузер
      r.push({ k: 'Браузер', v: navigator.userAgent, s: 'ok' });

      // Расширение (мост)
      const bridgeReady = extIsReady();
      r.push({ 
        k: 'Расширение (мост)', 
        v: bridgeReady ? 'Обнаружено' : 'Не найдено', 
        s: bridgeReady ? 'ok' : 'err' 
      });

      // Ping тест
      if (bridgeReady) {
        const pingResult = await ping();
        r.push({ 
          k: 'Связь с расширением', 
          v: pingResult ? 'Успешно' : 'Не отвечает', 
          s: pingResult ? 'ok' : 'err' 
        });
      }

      // Доступ к MEXC API
      if (bridgeReady) {
        const p = await probe();
        if (p.type === 'PROBE_OK') {
          r.push({ k: 'Доступ к MEXC API', v: 'Успешно', s: 'ok' });
        } else {
          r.push({ k: 'Доступ к MEXC API', v: String(p.error || 'Ошибка'), s: 'err' });
        }
      }

      // URL страницы
      r.push({ k: 'URL страницы', v: window.location.href, s: 'ok' });

      // Heartbeat статус
      r.push({ 
        k: 'Heartbeat от расширения', 
        v: heartbeatStatus === 'connected' ? 'Получен' : heartbeatStatus === 'waiting' ? 'Ожидание...' : 'Не получен', 
        s: heartbeatStatus === 'connected' ? 'ok' : heartbeatStatus === 'waiting' ? 'warn' : 'err' 
      });

      // Время диагностики
      r.push({ k: 'Время диагностики', v: new Date().toLocaleString('ru-RU'), s: 'ok' });

      setRows(r);

    } catch (error) {
      console.error('[Diagnostic] Error:', error);
      r.push({ 
        k: 'Ошибка диагностики', 
        v: error instanceof Error ? error.message : 'Неизвестная ошибка', 
        s: 'err' 
      });
      setRows(r);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostic();
      
      // Слушаем heartbeat сообщения
      const handleHeartbeat = (event: MessageEvent) => {
        if (event.data?.source === 'MEXC_TT' && event.data?.type === 'MEXC_HEARTBEAT') {
          setHeartbeatStatus('connected');
          console.log('[Diagnostic] Heartbeat received:', event.data);
        }
      };
      
      window.addEventListener('message', handleHeartbeat);
      
      // Таймаут для heartbeat
      const heartbeatTimeout = setTimeout(() => {
        if (heartbeatStatus === 'waiting') {
          setHeartbeatStatus('disconnected');
        }
      }, 10000);
      
      return () => {
        window.removeEventListener('message', handleHeartbeat);
        clearTimeout(heartbeatTimeout);
      };
    }
  }, [isOpen, heartbeatStatus]);

  // Перезапускаем диагностику при изменении статуса heartbeat
  useEffect(() => {
    if (isOpen && heartbeatStatus !== 'waiting') {
      runDiagnostic();
    }
  }, [heartbeatStatus, isOpen]);

  const getStatusColor = (s?: 'ok' | 'err' | 'warn') => {
    switch (s) {
      case 'ok':
        return 'text-green-400';
      case 'warn':
        return 'text-yellow-400';
      case 'err':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80">
      <div className="w-[600px] rounded-lg p-8 bg-black border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Диагностика</h3>
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-md bg-white hover:bg-gray-100 text-black transition-colors font-medium"
          >
            Закрыть
          </button>
        </div>
        
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={i} className="flex justify-between gap-4 text-white">
              <span className="text-gray-400">{r.k}</span>
              <span className={getStatusColor(r.s)}>{r.v}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-6 text-sm text-gray-400">
          Если «Расширение (мост): Не найдено» — проверь настройки доступа сайта в chrome://extensions и перезагрузку страницы.
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={runDiagnostic}
            disabled={isLoading}
            className="flex-1 bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:opacity-50 text-black px-4 py-2 rounded-md transition-colors font-medium"
          >
            {isLoading ? 'Проверяем...' : 'Повторить диагностику'}
          </button>
          
          <button
            onClick={() => window.open('chrome://extensions/', '_blank')}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
          >
            Расширения
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticModal;
