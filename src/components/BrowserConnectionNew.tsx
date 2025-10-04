import React, { useState, useEffect } from 'react';

interface BrowserConnectionProps {
  onConnectionStatus: (connected: boolean) => void;
  onOrderBookData: (data: any) => void;
  currentTicker?: string;
}

export const BrowserConnection: React.FC<BrowserConnectionProps> = ({ 
  onConnectionStatus, 
  onOrderBookData,
  currentTicker = 'BTCUSDT'
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'extension' | 'injection'>('extension');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showConnectionMethod, setShowConnectionMethod] = useState(false);

  // Проверка подключения
  useEffect(() => {
    const checkConnection = () => {
      // Проверяем данные в localStorage
      const orderBookData = localStorage.getItem('mexc_orderbook_data');
      if (orderBookData) {
        try {
          const data = JSON.parse(orderBookData);
          if (data.bids && data.asks) {
            setIsConnected(true);
            onConnectionStatus(true);
            onOrderBookData(data);
          }
        } catch (e) {
          console.error('Error parsing order book data:', e);
        }
      }
    };

    // Проверяем каждые 2 секунды
    const interval = setInterval(checkConnection, 2000);
    checkConnection(); // Первоначальная проверка

    return () => clearInterval(interval);
  }, [onConnectionStatus, onOrderBookData]);

  // Открытие MEXC с правильным URL
  const openMexcInNewTab = () => {
    const ticker = currentTicker || 'BTCUSDT';
    const url = `https://www.mexc.com/ru-RU/exchange/${ticker}`;
    
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        alert('Не удалось открыть новое окно. Проверьте блокировщик всплывающих окон.');
      }
    } catch (error) {
      console.error('Error opening MEXC:', error);
      alert('Ошибка при открытии MEXC. Проверьте настройки браузера.');
    }
  };

  // Инжекция скрипта (альтернативный метод)
  const injectScript = () => {
    const iframe = document.getElementById('mexc-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        const script = `
          console.log('Скрипт инжектирован в MEXC iframe');
          // Здесь может быть код для извлечения данных
        `;
        iframe.contentWindow.postMessage({ type: 'INJECT_SCRIPT', script }, '*');
      } catch (e) {
        console.error('Ошибка инжекции:', e);
        alert('Ошибка при инжекции скрипта. Попробуйте использовать расширение.');
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
      {/* Заголовок и статус */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-white">Подключение к MEXC</h2>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-white text-sm">
            {isConnected ? 'Подключен' : 'Не подключен'}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowConnectionMethod(!showConnectionMethod)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            {showConnectionMethod ? 'Скрыть' : 'Методы'} ▼
          </button>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            {showInstructions ? 'Скрыть' : 'Инструкции'} ▼
          </button>
          <button
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
          >
            {showTroubleshooting ? 'Скрыть' : 'Помощь'} ▼
          </button>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="flex space-x-3 mb-4">
        <button
          onClick={openMexcInNewTab}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
        >
          🚀 Открыть MEXC
        </button>
        <button
          onClick={() => window.open('chrome://extensions/', '_blank')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          ⚙️ Расширения Chrome
        </button>
      </div>

      {/* Выбор метода подключения */}
      {showConnectionMethod && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600">
          <h3 className="text-white font-medium mb-3">Метод подключения:</h3>
          <div className="flex space-x-6 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="extension"
                checked={connectionMethod === 'extension'}
                onChange={(e) => setConnectionMethod(e.target.value as 'extension' | 'injection')}
                className="mr-2"
              />
              <span className="text-white">Расширение браузера (Рекомендуется)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="injection"
                checked={connectionMethod === 'injection'}
                onChange={(e) => setConnectionMethod(e.target.value as 'extension' | 'injection')}
                className="mr-2"
              />
              <span className="text-white">Инжекция скриптов</span>
            </label>
          </div>
          
          {connectionMethod === 'extension' ? (
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                ✅ Автоматически извлекает данные ордербука со страницы MEXC
              </p>
              <p className="text-gray-300 text-sm">
                ✅ Работает с любыми тикерами, включая оценочную зону
              </p>
              <p className="text-gray-300 text-sm">
                ✅ Безопасно и надежно
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                ⚠️ Может не работать из-за CORS политик
              </p>
              <p className="text-gray-300 text-sm">
                ⚠️ Альтернативный метод через iframe
              </p>
              <button
                onClick={injectScript}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
              >
                Попробовать подключение
              </button>
            </div>
          )}
        </div>
      )}

      {/* Инструкции */}
      {showInstructions && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600">
          <h3 className="text-white font-medium mb-3">Пошаговая инструкция:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div className="text-white">
                <strong>Установите расширение:</strong>
                <ul className="text-sm text-gray-300 mt-1 ml-4 space-y-1">
                  <li>• Откройте chrome://extensions/</li>
                  <li>• Включите "Режим разработчика"</li>
                  <li>• Нажмите "Загрузить распакованное расширение"</li>
                  <li>• Выберите папку "browser-extension" из проекта</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div className="text-white">
                <strong>Откройте MEXC:</strong>
                <ul className="text-sm text-gray-300 mt-1 ml-4 space-y-1">
                  <li>• Нажмите кнопку "Открыть MEXC" выше</li>
                  <li>• Войдите в свой аккаунт</li>
                  <li>• Убедитесь, что ордербук отображается</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div className="text-white">
                <strong>Выберите тикер:</strong>
                <ul className="text-sm text-gray-300 mt-1 ml-4 space-y-1">
                  <li>• Введите нужный тикер в поле "Тикер"</li>
                  <li>• Обновите страницу MEXC</li>
                  <li>• Ордербук должен отображаться</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
              <div className="text-white">
                <strong>Готово!</strong>
                <ul className="text-sm text-gray-300 mt-1 ml-4 space-y-1">
                  <li>• Статус должен стать зеленым</li>
                  <li>• Ордербук обновляется автоматически</li>
                  <li>• Работает с любыми тикерами</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Устранение неполадок */}
      {showTroubleshooting && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600">
          <h3 className="text-white font-medium mb-3">Устранение неполадок:</h3>
          
          <div className="space-y-3">
            <div className="bg-red-900/20 border border-red-600/30 rounded p-3">
              <h4 className="text-red-400 font-medium mb-2">Не открывается MEXC:</h4>
              <ul className="text-sm text-red-300 space-y-1">
                <li>• Проверьте блокировщик всплывающих окон</li>
                <li>• Попробуйте открыть в новой вкладке вручную</li>
                <li>• Проверьте интернет-соединение</li>
                <li>• Очистите кэш браузера</li>
              </ul>
            </div>
            
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3">
              <h4 className="text-yellow-400 font-medium mb-2">Не работает подключение:</h4>
              <ul className="text-sm text-yellow-300 space-y-1">
                <li>• Обновите страницу MEXC</li>
                <li>• Проверьте, что расширение включено</li>
                <li>• Убедитесь, что ордербук отображается</li>
                <li>• Попробуйте другой тикер</li>
              </ul>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-600/30 rounded p-3">
              <h4 className="text-blue-400 font-medium mb-2">Проверка расширения:</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Убедитесь, что расширение загружено</li>
                <li>• Проверьте права доступа к mexc.com</li>
                <li>• Перезагрузите расширение</li>
                <li>• Проверьте консоль браузера (F12)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Скрытый iframe для инжекции */}
      {connectionMethod === 'injection' && (
        <iframe
          id="mexc-iframe"
          src={`https://www.mexc.com/ru-RU/exchange/${currentTicker}`}
          className="hidden"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
};
