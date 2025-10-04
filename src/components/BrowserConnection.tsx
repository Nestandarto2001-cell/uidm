import React, { useState, useEffect } from 'react';

interface BrowserConnectionProps {
  onConnectionStatus: (connected: boolean) => void;
  onOrderBookData: (data: any) => void;
}

export const BrowserConnection: React.FC<BrowserConnectionProps> = ({ 
  onConnectionStatus, 
  onOrderBookData 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'extension' | 'injection'>('extension');
  const [mexcUrl, setMexcUrl] = useState('https://www.mexc.com/ru-RU/exchange/');

  // Проверка подключения к браузеру
  useEffect(() => {
    const checkConnection = () => {
      // Проверяем наличие расширения
      if (connectionMethod === 'extension') {
        // @ts-ignore
        if (window.mexcExtension) {
          setIsConnected(true);
          onConnectionStatus(true);
        } else {
          setIsConnected(false);
          onConnectionStatus(false);
        }
      } else {
        // Проверяем инжекцию скриптов
        const iframe = document.getElementById('mexc-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          try {
            iframe.contentWindow.postMessage({ type: 'ping' }, '*');
            setIsConnected(true);
            onConnectionStatus(true);
          } catch (e) {
            setIsConnected(false);
            onConnectionStatus(false);
          }
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [connectionMethod, onConnectionStatus]);

  // Слушаем сообщения от браузера
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.mexc.com') return;
      
      if (event.data.type === 'orderbook') {
        onOrderBookData(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onOrderBookData]);

  const openMexcInNewTab = () => {
    const url = `${mexcUrl}${document.querySelector('input[placeholder*="тикер"]')?.value || 'BTCUSDT'}`;
    window.open(url, '_blank');
  };

  const injectScript = () => {
    const iframe = document.getElementById('mexc-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      const script = `
        (function() {
          // Скрипт для извлечения данных ордербука из MEXC
          const extractOrderBook = () => {
            const orderBookElement = document.querySelector('[data-testid="orderbook"]') || 
                                   document.querySelector('.orderbook') ||
                                   document.querySelector('[class*="orderbook"]');
            
            if (orderBookElement) {
              const bids = [];
              const asks = [];
              
              // Извлекаем данные покупки
              const bidRows = orderBookElement.querySelectorAll('[class*="bid"], [class*="buy"]');
              bidRows.forEach(row => {
                const priceEl = row.querySelector('[class*="price"]');
                const amountEl = row.querySelector('[class*="amount"], [class*="volume"]');
                if (priceEl && amountEl) {
                  bids.push([
                    parseFloat(priceEl.textContent.replace(/[^0-9.-]/g, '')),
                    parseFloat(amountEl.textContent.replace(/[^0-9.-]/g, ''))
                  ]);
                }
              });
              
              // Извлекаем данные продажи
              const askRows = orderBookElement.querySelectorAll('[class*="ask"], [class*="sell"]');
              askRows.forEach(row => {
                const priceEl = row.querySelector('[class*="price"]');
                const amountEl = row.querySelector('[class*="amount"], [class*="volume"]');
                if (priceEl && amountEl) {
                  asks.push([
                    parseFloat(priceEl.textContent.replace(/[^0-9.-]/g, '')),
                    parseFloat(amountEl.textContent.replace(/[^0-9.-]/g, ''))
                  ]);
                }
              });
              
              // Отправляем данные родительскому окну
              window.parent.postMessage({
                type: 'orderbook',
                payload: { bids, asks, timestamp: Date.now() }
              }, '*');
            }
          };
          
          // Запускаем извлечение каждые 500мс
          setInterval(extractOrderBook, 500);
          
          // Также слушаем изменения DOM
          const observer = new MutationObserver(extractOrderBook);
          observer.observe(document.body, { childList: true, subtree: true });
        })();
      `;
      
      try {
        iframe.contentWindow.eval(script);
        setIsConnected(true);
        onConnectionStatus(true);
      } catch (e) {
        console.error('Не удалось инжектировать скрипт:', e);
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Подключение к MEXC</h2>
      
      <div className="space-y-4">
        {/* Выбор метода подключения */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Метод подключения:
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="extension"
                checked={connectionMethod === 'extension'}
                onChange={(e) => setConnectionMethod(e.target.value as 'extension' | 'injection')}
                className="mr-2"
              />
              <span className="text-white">Расширение браузера</span>
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
        </div>

        {/* Статус подключения */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-white">
            {isConnected ? 'Подключен к MEXC' : 'Не подключен к MEXC'}
          </span>
        </div>

        {/* Действия */}
        <div className="flex space-x-4">
          {connectionMethod === 'extension' ? (
            <>
              <button
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Установить расширение
              </button>
              <button
                onClick={openMexcInNewTab}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Открыть MEXC в новой вкладке
              </button>
            </>
          ) : (
            <>
              <button
                onClick={openMexcInNewTab}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Открыть MEXC в новой вкладке
              </button>
              <button
                onClick={injectScript}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Подключиться через iframe
              </button>
            </>
          )}
        </div>

        {/* Инструкции */}
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-md">
          <h3 className="text-sm font-medium text-blue-400 mb-2">Инструкции:</h3>
          <ul className="text-sm text-blue-300 space-y-1">
            <li>• Откройте MEXC в браузере и войдите в аккаунт</li>
            <li>• Перейдите на страницу нужного тикера</li>
            <li>• Убедитесь, что ордербук отображается</li>
            <li>• Нажмите кнопку подключения выше</li>
            <li>• Данные будут автоматически передаваться в терминал</li>
          </ul>
        </div>

        {/* Скрытый iframe для инжекции */}
        {connectionMethod === 'injection' && (
          <iframe
            id="mexc-iframe"
            src={mexcUrl}
            className="hidden"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
};
