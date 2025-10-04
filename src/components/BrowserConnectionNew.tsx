import React, { useState, useEffect } from 'react';

interface BrowserConnectionProps {
  onConnectionStatus: (connected: boolean) => void;
  onOrderBookData: (data: any) => void;
  currentTicker?: string;
}

export const BrowserConnection: React.FC<BrowserConnectionProps> = ({ 
  onConnectionStatus, 
  onOrderBookData,
  currentTicker = 'BTC_USDT'
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'extension' | 'injection'>('extension');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showConnectionMethod, setShowConnectionMethod] = useState(false);

  // Функция для сворачивания других меню
  const toggleMenu = (menuType: 'instructions' | 'troubleshooting' | 'connectionMethod') => {
    // Сворачиваем все меню
    setShowInstructions(false);
    setShowTroubleshooting(false);
    setShowConnectionMethod(false);
    
    // Открываем выбранное меню
    switch (menuType) {
      case 'instructions':
        setShowInstructions(true);
        break;
      case 'troubleshooting':
        setShowTroubleshooting(true);
        break;
      case 'connectionMethod':
        setShowConnectionMethod(true);
        break;
    }
  };

  // Проверка подключения
  useEffect(() => {
    const checkConnection = () => {
      // Проверяем данные в localStorage
      const orderBookData = localStorage.getItem('mexc_orderbook_data');
      if (orderBookData) {
        try {
          const data = JSON.parse(orderBookData);
          console.log('Получены данные ордербука:', data);
          if (data.bids && data.asks && (data.bids.length > 0 || data.asks.length > 0)) {
            setIsConnected(true);
            onConnectionStatus(true);
            onOrderBookData(data);
            console.log('Подключение установлено:', data.bids.length, 'bids,', data.asks.length, 'asks');
          } else {
            console.log('Данные ордербука пусты');
          }
        } catch (e) {
          console.error('Error parsing order book data:', e);
        }
      } else {
        console.log('Нет данных ордербука в localStorage');
      }
    };

    // Слушаем сообщения от расширения
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'MEXC_ORDERBOOK_DATA') {
        console.log('Получены данные от расширения:', event.data.payload);
        const data = event.data.payload;
        if (data.bids && data.asks) {
          setIsConnected(true);
          onConnectionStatus(true);
          onOrderBookData(data);
          // Сохраняем в localStorage
          localStorage.setItem('mexc_orderbook_data', JSON.stringify(data));
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Проверяем каждую секунду
    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Первоначальная проверка

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, [onConnectionStatus, onOrderBookData]);

  // Открытие MEXC с правильным URL
  const openMexcInNewTab = () => {
    const ticker = currentTicker || 'BTC_USDT';
    // Используем правильный формат с нижним подчеркиванием
    const url = `https://www.mexc.com/ru-RU/exchange/${ticker}`;
    
    try {
      // Создаем ссылку для программного открытия
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Добавляем в DOM и кликаем
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('MEXC opened:', url);
    } catch (error) {
      console.error('Error opening MEXC:', error);
      // Fallback - показываем ссылку пользователю
      alert(`Не удалось открыть автоматически. Скопируйте ссылку: ${url}`);
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
            onClick={() => showConnectionMethod ? setShowConnectionMethod(false) : toggleMenu('connectionMethod')}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            {showConnectionMethod ? 'Скрыть' : 'Методы'} ▼
          </button>
          <button
            onClick={() => showInstructions ? setShowInstructions(false) : toggleMenu('instructions')}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            {showInstructions ? 'Скрыть' : 'Инструкции'} ▼
          </button>
          <button
            onClick={() => showTroubleshooting ? setShowTroubleshooting(false) : toggleMenu('troubleshooting')}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
          >
            {showTroubleshooting ? 'Скрыть' : 'Помощь'} ▼
          </button>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="flex flex-wrap gap-3 mb-4">
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
        <button
          onClick={() => {
            console.log('=== ДИАГНОСТИКА ПОДКЛЮЧЕНИЯ ===');
            console.log('localStorage данные:', localStorage.getItem('mexc_orderbook_data'));
            console.log('Текущий тикер:', currentTicker);
            console.log('Статус подключения:', isConnected);
            
            // Очищаем старые данные для тестирования
            localStorage.removeItem('mexc_orderbook_data');
            setIsConnected(false);
            onConnectionStatus(false);
            console.log('Данные очищены, ожидаем новые...');
          }}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
        >
          🔍 Диагностика
        </button>
        <button
          onClick={() => {
            // Отправляем тестовое сообщение
            window.postMessage({
              type: 'MEXC_ORDERBOOK_DATA',
              payload: {
                bids: [[50000, 0.1], [49999, 0.2], [49998, 0.3]],
                asks: [[50001, 0.1], [50002, 0.2], [50003, 0.3]],
                timestamp: Date.now(),
                url: 'test',
                symbol: currentTicker
              }
            }, '*');
            console.log('Отправлено тестовое сообщение');
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
        >
          🧪 Тест данных
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
                  <li>• Убедитесь, что расширение включено</li>
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
                  <li>• Перейдите на любую страницу с тикером</li>
                  <li>• Расширение автоматически отправит тестовые данные</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div className="text-white">
                <strong>Проверьте подключение:</strong>
                <ul className="text-sm text-gray-300 mt-1 ml-4 space-y-1">
                  <li>• Статус должен стать зеленым "Подключен"</li>
                  <li>• Ордербук должен заполниться тестовыми данными</li>
                  <li>• Используйте кнопку "Диагностика" для проверки</li>
                  <li>• Используйте кнопку "Тест данных" для проверки</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
              <div className="text-white">
                <strong>Готово!</strong>
                <ul className="text-sm text-gray-300 mt-1 ml-4 space-y-1">
                  <li>• Статус "Подключен" и зеленый индикатор</li>
                  <li>• Ордербук заполняется тестовыми данными</li>
                  <li>• Данные обновляются каждые 2 секунды</li>
                  <li>• Можете торговать с тестовыми данными</li>
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
