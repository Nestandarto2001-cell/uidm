import React from 'react';
import Tooltip from './SimpleTooltip';

interface TopActionsProps {
  onOpenMexc: () => void;
  onOpenExtensions: () => void;
  onDiagnostic: () => void;
  onTestData: () => void;
  isDiagnosticRunning: boolean;
  isTestDataRunning: boolean;
  currentTicker?: string;
}

export const TopActions: React.FC<TopActionsProps> = ({
  onOpenMexc,
  onOpenExtensions,
  onDiagnostic,
  onTestData,
  isDiagnosticRunning,
  isTestDataRunning
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Открыть MEXC */}
      <div className="relative">
        <button
          onClick={onOpenMexc}
          className="px-3 py-1 text-xs border border-slate-600/50 hover:bg-slate-700/50 text-slate-200 transition-colors"
        >
          Открыть MEXC
          <span className="ml-2 text-slate-400">?</span>
        </button>
        <Tooltip text="Открывает вкладку биржи для текущего тикера">
          <div className="absolute inset-0 pointer-events-none" />
        </Tooltip>
      </div>

      {/* Расширения Chrome */}
      <div className="relative">
        <button
          onClick={onOpenExtensions}
          className="px-3 py-1 text-xs border border-slate-600/50 hover:bg-slate-700/50 text-slate-200 transition-colors"
        >
          Расширение
          <span className="ml-2 text-slate-400">?</span>
        </button>
        <Tooltip text="Мост к стакану со страницы MEXC. Нужен для оценочной зоны">
          <div className="absolute inset-0 pointer-events-none" />
        </Tooltip>
      </div>

      {/* Диагностика */}
      <div className="relative">
        <button
          onClick={onDiagnostic}
          disabled={isDiagnosticRunning}
          className={`px-3 py-1 text-xs border border-slate-600/50 hover:bg-slate-700/50 text-slate-200 transition-colors ${
            isDiagnosticRunning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isDiagnosticRunning ? 'Диагностика...' : 'Диагностика'}
          <span className="ml-2 text-slate-400">?</span>
        </button>
        <Tooltip text="Проверка: heartbeat, ORDERBOOK, задержка, селекторы">
          <div className="absolute inset-0 pointer-events-none" />
        </Tooltip>
      </div>

      {/* Тест данных */}
      <div className="relative">
        <button
          onClick={onTestData}
          disabled={isTestDataRunning}
          className={`px-3 py-1 text-xs border border-slate-600/50 hover:bg-slate-700/50 text-slate-200 transition-colors ${
            isTestDataRunning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isTestDataRunning ? 'Тест...' : 'Тест данных'}
          <span className="ml-2 text-slate-400">?</span>
        </button>
        <Tooltip text="Локальная проверка без API. На статус не влияет">
          <div className="absolute inset-0 pointer-events-none" />
        </Tooltip>
      </div>
    </div>
  );
};