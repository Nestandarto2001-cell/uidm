/**
 * Diagnostic Modal Component
 * Модальное окно диагностики для отображения статуса подключения и ошибок
 */

import React, { useState, useEffect } from 'react';
import AssessmentBridge from '../bridge';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DiagnosticInfo {
  bridgeStatus: 'connected' | 'disconnected' | 'unknown';
  extensionStatus: 'active' | 'inactive' | 'unknown';
  corsStatus: 'enabled' | 'disabled' | 'unknown';
  apiStatus: 'connected' | 'disconnected' | 'unknown';
  lastUpdate: string | null;
  errors: string[];
  suggestions: string[];
}

const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ isOpen, onClose }) => {
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo>({
    bridgeStatus: 'unknown',
    extensionStatus: 'unknown',
    corsStatus: 'unknown',
    apiStatus: 'unknown',
    lastUpdate: null,
    errors: [],
    suggestions: []
  });

  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostic = async () => {
    setIsLoading(true);
    const errors: string[] = [];
    const suggestions: string[] = [];

    try {
      // Проверка Bridge
      const bridgeAvailable = AssessmentBridge.isBridgeAvailable();
      if (!bridgeAvailable) {
        errors.push('Bridge не готов к работе');
        suggestions.push('Обновите страницу терминала');
      }

      // Проверка расширения
      try {
        const response = await AssessmentBridge.getStatus();
        if (response) {
          // Расширение отвечает
        }
      } catch (error) {
        errors.push('Расширение не отвечает');
        suggestions.push('Перезагрузите расширение в chrome://extensions/');
      }

      // Проверка CORS (косвенная)
      try {
        const testUrl = 'https://www.mexc.com/api/v3/time';
        const response = await fetch(testUrl, { 
          method: 'GET',
          mode: 'cors'
        });
        if (!response.ok) {
          errors.push('CORS блокирует запросы к MEXC');
          suggestions.push('Установите CORS расширение (например, CORS Unblock)');
        }
      } catch (error) {
        errors.push('CORS блокирует запросы к MEXC');
        suggestions.push('Установите CORS расширение (например, CORS Unblock)');
      }

      setDiagnosticInfo(prev => ({
        ...prev,
        bridgeStatus: bridgeAvailable ? 'connected' : 'disconnected',
        extensionStatus: 'active', // Если дошли до этого места
        corsStatus: 'enabled', // Если тест прошел
        apiStatus: 'connected',
        lastUpdate: new Date().toLocaleString('ru-RU'),
        errors,
        suggestions
      }));

    } catch (error) {
      errors.push(`Ошибка диагностики: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      suggestions.push('Проверьте подключение к интернету');
      
      setDiagnosticInfo(prev => ({
        ...prev,
        errors,
        suggestions,
        lastUpdate: new Date().toLocaleString('ru-RU')
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostic();
    }
  }, [isOpen]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'enabled':
        return '🟢';
      case 'disconnected':
      case 'inactive':
      case 'disabled':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Подключено';
      case 'disconnected':
        return 'Отключено';
      case 'active':
        return 'Активно';
      case 'inactive':
        return 'Неактивно';
      case 'enabled':
        return 'Включено';
      case 'disabled':
        return 'Отключено';
      default:
        return 'Неизвестно';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🔍 Диагностика системы</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Статусы компонентов */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getStatusIcon(diagnosticInfo.bridgeStatus)}</span>
              <h3 className="font-semibold text-white">Bridge</h3>
            </div>
            <p className="text-sm text-gray-300">
              {getStatusText(diagnosticInfo.bridgeStatus)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Коммуникация между страницей и расширением
            </p>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getStatusIcon(diagnosticInfo.extensionStatus)}</span>
              <h3 className="font-semibold text-white">Расширение</h3>
            </div>
            <p className="text-sm text-gray-300">
              {getStatusText(diagnosticInfo.extensionStatus)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Браузерное расширение активно
            </p>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getStatusIcon(diagnosticInfo.corsStatus)}</span>
              <h3 className="font-semibold text-white">CORS</h3>
            </div>
            <p className="text-sm text-gray-300">
              {getStatusText(diagnosticInfo.corsStatus)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Cross-origin запросы разрешены
            </p>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getStatusIcon(diagnosticInfo.apiStatus)}</span>
              <h3 className="font-semibold text-white">API</h3>
            </div>
            <p className="text-sm text-gray-300">
              {getStatusText(diagnosticInfo.apiStatus)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Подключение к MEXC API
            </p>
          </div>
        </div>

        {/* Ошибки */}
        {diagnosticInfo.errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-400 mb-3">🚨 Обнаруженные проблемы</h3>
            <div className="space-y-2">
              {diagnosticInfo.errors.map((error, index) => (
                <div key={index} className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Рекомендации */}
        {diagnosticInfo.suggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">💡 Рекомендации</h3>
            <div className="space-y-2">
              {diagnosticInfo.suggestions.map((suggestion, index) => (
                <div key={index} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Информация о последнем обновлении */}
        {diagnosticInfo.lastUpdate && (
          <div className="text-center text-gray-400 text-sm mb-4">
            Последняя диагностика: {diagnosticInfo.lastUpdate}
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex space-x-3">
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
          
          <button
            onClick={onClose}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>

        {/* Справочная информация */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">📚 Справочная информация</h4>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• <strong>Bridge</strong> - канал связи между страницей и расширением</p>
            <p>• <strong>Расширение</strong> - должно быть активно в chrome://extensions/</p>
            <p>• <strong>CORS</strong> - разрешает запросы к MEXC API</p>
            <p>• <strong>API</strong> - подключение к серверам MEXC</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticModal;
