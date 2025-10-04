import React, { useState, useEffect } from 'react';

// Компонент для иконки вопроса с подсказкой
const HelpIcon: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        className="ml-1 text-blue-400 hover:text-blue-300 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        ❓
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-lg z-50">
          <div className="text-sm text-white">
            <div className="font-semibold text-blue-400 mb-1">{title}</div>
            {children}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

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
  const [mexcUrl, setMexcUrl] = useState('https://www.mexc.com/ru-RU/exchange/BTCUSDT');

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
    // Получаем текущий тикер из поля ввода
    const tickerInput = document.querySelector('input[placeholder*="тикер"]') as HTMLInputElement;
    const currentTicker = tickerInput?.value || 'BTCUSDT';
    const url = `https://www.mexc.com/ru-RU/exchange/${currentTicker}`;
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
        // Используем postMessage вместо eval для безопасности
        iframe.contentWindow?.postMessage({ type: 'INJECT_SCRIPT', script }, '*');
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
      
      <div className="space-y-6">
        {/* Выбор метода подключения */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Метод подключения:
            <HelpIcon title="Выберите способ подключения">
              <div className="space-y-2">
                <div><strong>Расширение браузера:</strong> Автоматически извлекает данные ордербука со страницы MEXC</div>
                <div><strong>Инжекция скриптов:</strong> Альтернативный метод через iframe (может быть заблокирован)</div>
              </div>
            </HelpIcon>
          </label>
          <div className="flex space-x-6">
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

        {/* Пошаговые инструкции */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            Пошаговая инструкция:
            <HelpIcon title="Подробное руководство">
              <div className="space-y-2">
                <div>Следуйте этим шагам для успешного подключения к MEXC и получения данных ордербука</div>
              </div>
            </HelpIcon>
          </h3>
          
          {connectionMethod === 'extension' ? (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div className="text-white">
                  <strong>Установите расширение:</strong> Загрузите расширение из папки проекта в Chrome
                  <button
                    onClick={() => window.open('chrome://extensions/', '_blank')}
                    className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Открыть расширения
                    <HelpIcon title="Установка расширения">
                      <div className="space-y-2">
                        <div>1. Включите "Режим разработчика"</div>
                        <div>2. Нажмите "Загрузить распакованное расширение"</div>
                        <div>3. Выберите папку "browser-extension" из проекта</div>
                        <div>4. Убедитесь, что расширение включено</div>
                      </div>
                    </HelpIcon>
                  </button>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div className="text-white">
                  <strong>Откройте MEXC:</strong> Перейдите на сайт MEXC и войдите в аккаунт
                  <button
                    onClick={openMexcInNewTab}
                    className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    Открыть MEXC
                    <HelpIcon title="Открытие MEXC">
                      <div className="space-y-2">
                        <div>1. Откроется новая вкладка с MEXC</div>
                        <div>2. Войдите в свой аккаунт</div>
                        <div>3. Убедитесь, что вы на странице с ордербуком</div>
                        <div>4. Проверьте, что ордербук отображается</div>
                      </div>
                    </HelpIcon>
                  </button>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div className="text-white">
                  <strong>Перейдите на нужный тикер:</strong> Введите тикер в поле выше и обновите страницу MEXC
                  <HelpIcon title="Выбор тикера">
                    <div className="space-y-2">
                      <div>1. Введите нужный тикер в поле "Тикер" выше</div>
                      <div>2. Нажмите кнопку "Открыть MEXC" еще раз</div>
                      <div>3. Убедитесь, что вы на правильной странице</div>
                      <div>4. Ордербук должен отображаться на странице</div>
                    </div>
                  </HelpIcon>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                <div className="text-white">
                  <strong>Готово!</strong> Данные ордербука автоматически передаются в терминал
                  <HelpIcon title="Проверка подключения">
                    <div className="space-y-2">
                      <div>• Статус "Подключен к MEXC" должен стать зеленым</div>
                      <div>• Ордербук в терминале должен обновляться</div>
                      <div>• Данные поступают каждую секунду</div>
                      <div>• Работает с любыми тикерами, включая оценочную зону</div>
                    </div>
                  </HelpIcon>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div className="text-white">
                  <strong>Откройте MEXC:</strong> Перейдите на сайт MEXC и войдите в аккаунт
                  <button
                    onClick={openMexcInNewTab}
                    className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    Открыть MEXC
                    <HelpIcon title="Открытие MEXC">
                      <div className="space-y-2">
                        <div>1. Откроется новая вкладка с MEXC</div>
                        <div>2. Войдите в свой аккаунт</div>
                        <div>3. Перейдите на нужный тикер</div>
                        <div>4. Убедитесь, что ордербук отображается</div>
                      </div>
                    </HelpIcon>
                  </button>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div className="text-white">
                  <strong>Подключитесь через iframe:</strong> Внедрите скрипт для извлечения данных
                  <button
                    onClick={injectScript}
                    className="ml-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
                  >
                    Подключиться
                    <HelpIcon title="Подключение через iframe">
                      <div className="space-y-2">
                        <div>⚠️ Этот метод может не работать из-за CORS политик</div>
                        <div>1. Нажмите кнопку "Подключиться"</div>
                        <div>2. Если не работает, используйте расширение</div>
                        <div>3. Проверьте консоль браузера на ошибки</div>
                      </div>
                    </HelpIcon>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Устранение неполадок */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-400 mb-2">
            Устранение неполадок:
            <HelpIcon title="Решение проблем">
              <div className="space-y-2">
                <div><strong>Не работает подключение:</strong></div>
                <div>• Обновите страницу MEXC</div>
                <div>• Проверьте, что расширение включено</div>
                <div>• Убедитесь, что ордербук отображается</div>
                <div>• Попробуйте другой тикер</div>
              </div>
            </HelpIcon>
          </h3>
          <ul className="text-sm text-yellow-300 space-y-1">
            <li>• Если статус "Не подключен", проверьте расширение</li>
            <li>• Убедитесь, что вы на странице с ордербуком</li>
            <li>• Попробуйте обновить страницу MEXC</li>
            <li>• Проверьте консоль браузера (F12) на ошибки</li>
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
