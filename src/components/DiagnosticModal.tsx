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
    }
  }, [isOpen]);

  const getStatusColor = (s?: 'ok' | 'err' | 'warn') => {
    switch (s) {
      case 'ok':
        return 'text-emerald-400';
      case 'warn':
        return 'text-amber-400';
      case 'err':
        return 'text-rose-400';
      default:
        return 'text-slate-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className="w-[720px] rounded-2xl p-6 bg-[#0f172a] border border-[#1f2a44] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-100">🔍 Диагностика</h3>
          <button 
            onClick={onClose} 
            className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            Закрыть
          </button>
        </div>
        
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex justify-between gap-4 text-slate-200">
              <span className="opacity-80">{r.k}</span>
              <span className={getStatusColor(r.s)}>{r.v}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-4 text-sm text-slate-400">
          Если «Расширение (мост): Не найдено» — проверь настройки доступа сайта в chrome://extensions и перезагрузку страницы.
        </div>
        
        <div className="mt-4 flex space-x-3">
          <button
            onClick={runDiagnostic}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isLoading ? 'Проверяем...' : '🔄 Повторить диагностику'}
          </button>
          
          <button
            onClick={() => window.open('chrome://extensions/', '_blank')}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            🔧 Расширения
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticModal;
