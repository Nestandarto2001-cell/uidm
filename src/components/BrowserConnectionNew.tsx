import React, { useState, useEffect } from 'react';
import { TooltipButton } from './SimpleTooltip';
import { TopActions } from './TopActions';
import { CollapsiblePanel } from './CollapsiblePanel';
import { ExtensionPanel } from './ExtensionPanel';

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
  
  // Состояния для операций
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [isTestDataRunning, setIsTestDataRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string>('');
  const [isExtensionPanelOpen, setIsExtensionPanelOpen] = useState(false);
  const [testDataResult, setTestDataResult] = useState<string>('');
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  
  // Ссылки для прерывания операций
  const diagnosticAbortController = React.useRef<AbortController | null>(null);
  const testDataAbortController = React.useRef<AbortController | null>(null);

  // Функция для показа уведомлений
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Функции для прерывания операций
  const cancelDiagnostic = () => {
    if (diagnosticAbortController.current) {
      diagnosticAbortController.current.abort();
      diagnosticAbortController.current = null;
      setIsDiagnosticRunning(false);
      setDiagnosticResult('Диагностика прервана пользователем');
      showNotification('info', 'Диагностика прервана');
    }
  };

  const cancelTestData = () => {
    if (testDataAbortController.current) {
      testDataAbortController.current.abort();
      testDataAbortController.current = null;
      setIsTestDataRunning(false);
      setTestDataResult('Тест данных прерван пользователем');
      showNotification('info', 'Тест данных прерван');
    }
  };

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
          // Проверяем, не тестовые ли это данные
          if (data.url === 'test') {
            console.log('Получены тестовые данные - НЕ устанавливаем статус подключения');
            onOrderBookData(data);
            // НЕ сохраняем тестовые данные в localStorage
            // НЕ устанавливаем статус подключения
          } else {
            // Реальные данные от MEXC
            console.log('Получены реальные данные от MEXC - устанавливаем статус подключения');
            setIsConnected(true);
            onConnectionStatus(true);
            onOrderBookData(data);
            // Сохраняем в localStorage
            localStorage.setItem('mexc_orderbook_data', JSON.stringify(data));
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Проверяем с частотой 60 FPS
    const interval = setInterval(checkConnection, 16);
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
    <div className="bg-slate-800/60 border border-slate-600/50 p-4 mb-4">
      {/* Заголовок и статус */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-slate-200">Действия</h2>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => showConnectionMethod ? setShowConnectionMethod(false) : toggleMenu('connectionMethod')}
            className="px-3 py-1 border border-slate-600/50 hover:bg-slate-700/50 text-slate-200 text-xs transition-colors"
          >
            {showConnectionMethod ? 'Скрыть' : 'Способы подключения'} ▼
          </button>
          
          <button
            onClick={() => showInstructions ? setShowInstructions(false) : toggleMenu('instructions')}
            className="px-3 py-1 border border-slate-600/50 hover:bg-slate-700/50 text-slate-200 text-xs transition-colors"
          >
            {showInstructions ? 'Скрыть' : 'Инструкции'} ▼
          </button>
          
          <button
            onClick={() => showTroubleshooting ? setShowTroubleshooting(false) : toggleMenu('troubleshooting')}
            className="px-3 py-1 border border-slate-600/50 hover:bg-slate-700/50 text-slate-200 text-xs transition-colors"
          >
            {showTroubleshooting ? 'Скрыть' : 'Помощь'} ▼
          </button>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="flex flex-wrap gap-3 mb-4">
        <TopActions
          onOpenMexc={openMexcInNewTab}
          onOpenExtensions={() => setIsExtensionPanelOpen(true)}
          onDiagnostic={async () => {
            if (isDiagnosticRunning) return;
            
            setIsDiagnosticRunning(true);
            setDiagnosticResult('');
            diagnosticAbortController.current = new AbortController();
            
            try {
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, 1000);
                diagnosticAbortController.current?.signal.addEventListener('abort', () => {
                  clearTimeout(timeout);
                  reject(new Error('Operation cancelled'));
                });
              });
              
              console.log('=== ДИАГНОСТИКА ПОДКЛЮЧЕНИЯ ===');
              const localStorageData = localStorage.getItem('mexc_orderbook_data');
              console.log('localStorage данные:', localStorageData);
              console.log('Текущий тикер:', currentTicker);
              console.log('Статус подключения:', isConnected);
              
              let result = `Диагностика завершена:\n`;
              result += `• Текущий тикер: ${currentTicker}\n`;
              result += `• Статус подключения: ${isConnected ? 'Подключен' : 'Не подключен'}\n`;
              result += `• Данные в localStorage: ${localStorageData ? 'Есть' : 'Нет'}\n`;
              
              if (localStorageData) {
                try {
                  const data = JSON.parse(localStorageData);
                  result += `• Количество bids: ${data.bids?.length || 0}\n`;
                  result += `• Количество asks: ${data.asks?.length || 0}\n`;
                  result += `• Время последнего обновления: ${new Date(data.timestamp).toLocaleString()}\n`;
                } catch (e) {
                  result += `• Ошибка парсинга данных: ${e}\n`;
                }
              }
              
              localStorage.removeItem('mexc_orderbook_data');
              setIsConnected(false);
              onConnectionStatus(false);
              console.log('Данные очищены, ожидаем новые...');
              
              result += `• Старые данные очищены\n`;
              result += `• Готов к получению новых данных`;
              
              setDiagnosticResult(result);
              showNotification('success', 'Диагностика завершена успешно');
              
            } catch (error) {
              if (error instanceof Error && error.message === 'Operation cancelled') {
                return;
              }
              setDiagnosticResult(`Ошибка диагностики: ${error}`);
              showNotification('error', 'Ошибка при выполнении диагностики');
            } finally {
              setIsDiagnosticRunning(false);
              diagnosticAbortController.current = null;
            }
          }}
          onTestData={async () => {
            if (isTestDataRunning) return;
            
            setIsTestDataRunning(true);
            setTestDataResult('');
            testDataAbortController.current = new AbortController();
            
            try {
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, 800);
                testDataAbortController.current?.signal.addEventListener('abort', () => {
                  clearTimeout(timeout);
                  reject(new Error('Operation cancelled'));
                });
              });
              
              const testData = {
                bids: [[50000, 0.1], [49999, 0.2], [49998, 0.3]],
                asks: [[50001, 0.1], [50002, 0.2], [50003, 0.3]],
                timestamp: Date.now(),
                url: 'test',
                symbol: currentTicker
              };
              
              window.postMessage({
                type: 'MEXC_ORDERBOOK_DATA',
                payload: testData
              }, '*');
              
              console.log('Отправлено тестовое сообщение');
              
              let result = `Тест данных завершен:\n`;
              result += `• Отправлено ${testData.bids.length} bids\n`;
              result += `• Отправлено ${testData.asks.length} asks\n`;
              result += `• Тикер: ${currentTicker}\n`;
              result += `• Время: ${new Date().toLocaleString()}\n`;
              result += `• Статус подключения НЕ изменен`;
              
              setTestDataResult(result);
              showNotification('success', 'Тестовые данные отправлены');
              
            } catch (error) {
              if (error instanceof Error && error.message === 'Operation cancelled') {
                return;
              }
              setTestDataResult(`Ошибка теста: ${error}`);
              showNotification('error', 'Ошибка при отправке тестовых данных');
            } finally {
              setIsTestDataRunning(false);
              testDataAbortController.current = null;
            }
          }}
          isDiagnosticRunning={isDiagnosticRunning}
          isTestDataRunning={isTestDataRunning}
          currentTicker={currentTicker}
        />
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

      {/* Уведомления */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-600 text-white' :
          notification.type === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {notification.type === 'success' ? '✅' :
                 notification.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Результаты операций - сворачиваемая панель */}
      {(diagnosticResult || testDataResult) && (
        <CollapsiblePanel
          title="Результаты операций"
          storageKey="diagnosticsCollapsed"
          status={diagnosticResult ? 'success' : testDataResult ? 'info' : undefined}
        >
          {diagnosticResult && (
            <div className="mb-4">
              <h4 className="text-yellow-400 font-medium mb-2 text-sm">🔍 Диагностика:</h4>
              <div className="bg-gray-800 rounded p-3">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">{diagnosticResult}</pre>
              </div>
            </div>
          )}
          
          {testDataResult && (
            <div>
              <h4 className="text-purple-400 font-medium mb-2 text-sm">🧪 Тест данных:</h4>
              <div className="bg-gray-800 rounded p-3">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">{testDataResult}</pre>
              </div>
            </div>
          )}
        </CollapsiblePanel>
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
      
      {/* Extension Panel Modal */}
      <ExtensionPanel
        isOpen={isExtensionPanelOpen}
        onClose={() => setIsExtensionPanelOpen(false)}
      />
    </div>
  );
};
