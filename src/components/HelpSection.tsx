/**
 * Help Section Component
 * Горизонтальное отображение инструкций, помощи и горячих клавиш
 */

import React, { useState } from 'react';

interface HelpItem {
  id: string;
  title: string;
  content: string;
  icon: string;
}

interface HelpSectionProps {
  className?: string;
}

export const HelpSection: React.FC<HelpSectionProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('instructions');

  const helpSections = {
    instructions: {
      title: '📖 Как подключиться',
      icon: '📖',
      items: [
        {
          id: 'cors-setup',
          title: 'Настройка CORS',
          content: '1. Установите CORS расширение (например, CORS Unblock)\n2. Включите расширение в браузере\n3. Обновите страницу MEXC\n4. Проверьте статус подключения в терминале',
          icon: '🌐'
        },
        {
          id: 'api-setup',
          title: 'Настройка API',
          content: '1. Войдите в MEXC → API Management\n2. Создайте новый API ключ\n3. Настройте права: Read + Trade\n4. Добавьте IP в whitelist\n5. Введите ключи в терминале',
          icon: '🔑'
        },
        {
          id: 'extension-setup',
          title: 'Настройка расширения',
          content: '1. Откройте chrome://extensions/\n2. Включите "Режим разработчика"\n3. Загрузите расширение из папки browser-extension\n4. Обновите вкладки MEXC и терминала',
          icon: '🔧'
        }
      ]
    },
    troubleshooting: {
      title: '🛠️ Частые проблемы',
      icon: '🛠️',
      items: [
        {
          id: 'cors-error',
          title: 'CORS блокирует запросы',
          content: 'Проблема: Браузер блокирует запросы к MEXC API\nРешение:\n• Установите CORS расширение\n• Включите расширение\n• Обновите страницу MEXC\n• Проверьте статус в диагностике',
          icon: '🚫'
        },
        {
          id: 'extension-not-working',
          title: 'Расширение не работает',
          content: 'Проблема: Расширение не отвечает или неактивно\nРешение:\n• Перезагрузите расширение в chrome://extensions/\n• Проверьте, что расширение включено\n• Обновите страницы MEXC и терминала\n• Проверьте логи в DevTools',
          icon: '🔌'
        },
        {
          id: 'api-errors',
          title: 'Ошибки API',
          content: 'Проблема: API ключи не работают\nРешение:\n• Проверьте правильность Key и Secret\n• Убедитесь в наличии прав Read/Trade\n• Проверьте IP whitelist\n• Проверьте лимиты API',
          icon: '❌'
        },
        {
          id: 'data-not-updating',
          title: 'Данные не обновляются',
          content: 'Проблема: Ордербук и данные не обновляются\nРешение:\n• Проверьте подключение к интернету\n• Обновите страницу терминала\n• Перезапустите приложение\n• Проверьте CORS расширение',
          icon: '🔄'
        }
      ]
    },
    shortcuts: {
      title: '⌨️ Горячие клавиши',
      icon: '⌨️',
      items: [
        {
          id: 'general-shortcuts',
          title: 'Общие',
          content: 'Ctrl + / - Быстрый поиск торговой пары\nEnter - Подтверждение ордера\nEsc - Отмена операции\nTab - Переключение между полями',
          icon: '⚡'
        },
        {
          id: 'trading-shortcuts',
          title: 'Торговля',
          content: 'Ctrl + B - Быстрая покупка\nCtrl + S - Быстрая продажа\nF5 - Обновить данные\nCtrl + R - Перезагрузить страницу',
          icon: '💰'
        },
        {
          id: 'navigation-shortcuts',
          title: 'Навигация',
          content: 'Ctrl + 1 - Переключиться на Trading\nCtrl + 2 - Переключиться на Assessment Zone\nF11 - Полноэкранный режим\nCtrl + Shift + I - Открыть DevTools',
          icon: '🧭'
        }
      ]
    }
  };

  const currentSection = helpSections[activeTab as keyof typeof helpSections];

  return (
    <div className={`bg-slate-800/60 rounded-lg p-6 ${className}`}>
      {/* Заголовок */}
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🆘 Справка и поддержка
      </h2>

      {/* Табы */}
      <div className="flex space-x-1 mb-6 bg-slate-700/50 rounded-lg p-1">
        {Object.entries(helpSections).map(([key, section]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === key
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-slate-600/50'
            }`}
          >
            <span className="text-lg">{section.icon}</span>
            <span className="font-medium">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Контент */}
      <div className="space-y-4">
        {currentSection.items.map((item) => (
          <div key={item.id} className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Дополнительные ссылки */}
      <div className="mt-6 pt-4 border-t border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-3">
          🔗 Полезные ссылки
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <a
              href="https://www.mexc.com/user/api"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">🔑</span>
                <span className="text-white font-medium">MEXC API Management</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Создание и настройка API ключей</p>
            </a>
            
            <a
              href="https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-green-400">🌐</span>
                <span className="text-white font-medium">CORS Unblock</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">CORS расширение для Chrome</p>
            </a>
          </div>
          
          <div className="space-y-2">
            <a
              href="chrome://extensions/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-purple-400">🔧</span>
                <span className="text-white font-medium">Chrome Extensions</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Управление расширениями браузера</p>
            </a>
            
            <a
              href="https://www.mexc.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">🏢</span>
                <span className="text-white font-medium">MEXC Exchange</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Официальный сайт биржи</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
