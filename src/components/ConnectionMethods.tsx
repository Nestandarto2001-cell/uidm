/**
 * Connection Methods Component
 * Горизонтальное отображение способов подключения с подробными описаниями
 */

import React from 'react';

interface ConnectionMethod {
  id: string;
  title: string;
  description: string;
  features: string[];
  requirements: string[];
  icon: string;
  status: 'available' | 'requires_setup' | 'unavailable';
}

const connectionMethods: ConnectionMethod[] = [
  {
    id: 'api',
    title: 'API ключ MEXC',
    description: 'Прямая торговля и отображение баланса через официальный API',
    features: [
      'Размещение ордеров',
      'Просмотр баланса',
      'История сделок',
      'Управление позициями'
    ],
    requirements: [
      'API ключ с правами Read/Trade',
      'IP whitelist настроен',
      'Стабильное интернет-соединение'
    ],
    icon: '🔑',
    status: 'requires_setup'
  },
  {
    id: 'cors',
    title: 'Публичные данные (CORS)',
    description: 'Просмотр стаканов и графиков без авторизации через CORS расширение',
    features: [
      'Real-time ордербук',
      'Рыночные данные',
      'Графики цен',
      'Статистика торгов'
    ],
    requirements: [
      'CORS расширение в браузере',
      'Активная страница MEXC',
      'Подключение к интернету'
    ],
    icon: '🌐',
    status: 'requires_setup'
  },
  {
    id: 'assessment',
    title: 'Assessment Zone',
    description: 'Мониторинг оценочной зоны для отслеживания новых токенов',
    features: [
      'Автоматический мониторинг',
      'Уведомления о новых токенах',
      'История оценок',
      'Фильтрация и поиск'
    ],
    requirements: [
      'Активное расширение',
      'Подключение к MEXC сайту'
    ],
    icon: '📊',
    status: 'available'
  }
];

interface ConnectionMethodsProps {
  onMethodSelect?: (methodId: string) => void;
}

export const ConnectionMethods: React.FC<ConnectionMethodsProps> = ({ onMethodSelect }) => {
  const getStatusColor = (status: ConnectionMethod['status']) => {
    switch (status) {
      case 'available':
        return 'border-green-500 bg-green-900/20';
      case 'requires_setup':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'unavailable':
        return 'border-red-500 bg-red-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getStatusText = (status: ConnectionMethod['status']) => {
    switch (status) {
      case 'available':
        return 'Доступно';
      case 'requires_setup':
        return 'Требует настройки';
      case 'unavailable':
        return 'Недоступно';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusIcon = (status: ConnectionMethod['status']) => {
    switch (status) {
      case 'available':
        return '🟢';
      case 'requires_setup':
        return '🟡';
      case 'unavailable':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-slate-800/60 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🔌 Способы подключения
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {connectionMethods.map((method) => (
          <div
            key={method.id}
            className={`border-2 rounded-lg p-6 transition-all duration-200 hover:scale-105 cursor-pointer ${getStatusColor(method.status)}`}
            onClick={() => onMethodSelect?.(method.id)}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{method.icon}</span>
                <h3 className="text-lg font-semibold text-white">
                  {method.title}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getStatusIcon(method.status)}</span>
                <span className="text-xs text-gray-300">
                  {getStatusText(method.status)}
                </span>
              </div>
            </div>

            {/* Описание */}
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              {method.description}
            </p>

            {/* Возможности */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-green-400 mb-2">
                ✨ Возможности:
              </h4>
              <ul className="space-y-1">
                {method.features.map((feature, index) => (
                  <li key={index} className="text-xs text-gray-300 flex items-center space-x-2">
                    <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Требования */}
            <div>
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                📋 Требования:
              </h4>
              <ul className="space-y-1">
                {method.requirements.map((requirement, index) => (
                  <li key={index} className="text-xs text-gray-300 flex items-center space-x-2">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full"></span>
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Кнопка действия */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              {method.status === 'available' && (
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                  Использовать
                </button>
              )}
              {method.status === 'requires_setup' && (
                <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                  Настроить
                </button>
              )}
              {method.status === 'unavailable' && (
                <button 
                  disabled
                  className="w-full bg-gray-600 text-gray-400 py-2 px-4 rounded-lg cursor-not-allowed text-sm"
                >
                  Недоступно
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Дополнительная информация */}
      <div className="mt-8 p-4 bg-slate-700/50 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">
          💡 Рекомендации по выбору
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-blue-400 mb-2">Для торговли</h4>
            <p>Используйте API ключ MEXC для полного доступа к торговым функциям</p>
          </div>
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Для анализа</h4>
            <p>CORS расширение позволит просматривать данные без настройки API</p>
          </div>
          <div>
            <h4 className="font-semibold text-purple-400 mb-2">Для мониторинга</h4>
            <p>Assessment Zone поможет отслеживать новые токены автоматически</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionMethods;
