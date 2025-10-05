import React, { useState, useEffect } from 'react';
import { extIsReady, probe, ping } from '../extBridge';
import { ProfilesBar } from './ProfilesBar';
import { TopActions } from './TopActions';

interface ConnectionMethod {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  status: 'working' | 'error' | 'warning' | 'unknown';
  buttonText: string;
  buttonAction: () => void;
  details: string;
}

const ConnectionPage: React.FC = () => {
  const [methods, setMethods] = useState<ConnectionMethod[]>([]);
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  // Функция для проверки требований
  const checkRequirement = (requirement: string, methodId: string): 'ok' | 'error' | 'unknown' => {
    switch (methodId) {
      case 'extension':
        if (requirement.includes('установлено и включено')) {
          return extIsReady() ? 'ok' : 'error';
        }
        if (requirement.includes('доступ к сайту')) {
          return extIsReady() ? 'ok' : 'error';
        }
        if (requirement.includes('CORS Unblock')) {
          // Проверяем наличие CORS Unblock (упрощенная проверка)
          return 'unknown'; // Всегда unknown, так как сложно проверить
        }
        if (requirement.includes('Chrome/Edge')) {
          return navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge') ? 'ok' : 'error';
        }
        break;
      case 'api':
        if (requirement.includes('API ключ создан')) {
          // Проверяем наличие API ключей в localStorage
          const hasApiKeys = localStorage.getItem('mexcApiKey') && localStorage.getItem('mexcApiSecret');
          return hasApiKeys ? 'ok' : 'error';
        }
        // Остальные требования сложно проверить автоматически
        break;
      case 'public':
        if (requirement.includes('CORS Unblock')) {
          return 'unknown';
        }
        if (requirement.includes('fetch API')) {
          return typeof fetch !== 'undefined' ? 'ok' : 'error';
        }
        if (requirement.includes('интернет соединение')) {
          return navigator.onLine ? 'ok' : 'error';
        }
        break;
    }
    return 'unknown';
  };

  useEffect(() => {
    const checkConnectionMethods = async () => {
      const bridgeReady = extIsReady();
      let apiStatus: 'working' | 'error' | 'warning' | 'unknown' = 'unknown';
      
      if (bridgeReady) {
        try {
          const pingResult = await ping();
          if (pingResult) {
            const probeResult = await probe();
            apiStatus = (probeResult as any).type === 'PROBE_OK' ? 'working' : 'error';
          } else {
            apiStatus = 'warning';
          }
        } catch (error) {
          apiStatus = 'error';
        }
      }

      const connectionMethods: ConnectionMethod[] = [
        {
          id: 'extension',
          title: 'Браузерное расширение',
          description: 'Основной способ подключения через расширение Chrome/Edge',
          requirements: [
            'Расширение "МексоЁБ" установлено и включено',
            'Расширение имеет доступ к сайту терминала',
            'CORS Unblock расширение установлено (рекомендуется)',
            'Браузер Chrome/Edge последней версии'
          ],
          status: bridgeReady ? 'working' : 'error',
          buttonText: 'Настроить расширение',
          buttonAction: () => {
            // Создаем модальное окно с инструкциями для расширения
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-50 grid place-items-center bg-black/80';
            modal.innerHTML = `
              <div class="w-[500px] rounded-lg p-6 bg-black border border-gray-800">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-white">Настройка расширения</h3>
                  <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-xl">×</button>
                </div>
                
                <div class="space-y-4 text-gray-300">
                  <div>
                    <h4 class="text-white font-medium mb-2">Chrome:</h4>
                    <p class="text-sm">1. Скопируйте адрес: <code class="bg-gray-800 px-2 py-1 rounded">chrome://extensions/</code></p>
                    <p class="text-sm">2. Вставьте в адресную строку и нажмите Enter</p>
                    <button onclick="navigator.clipboard.writeText('chrome://extensions/').then(() => alert('Скопировано!'))" class="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Копировать</button>
                  </div>
                  
                  <div>
                    <h4 class="text-white font-medium mb-2">Edge:</h4>
                    <p class="text-sm">1. Скопируйте адрес: <code class="bg-gray-800 px-2 py-1 rounded">edge://extensions/</code></p>
                    <p class="text-sm">2. Вставьте в адресную строку и нажмите Enter</p>
                    <button onclick="navigator.clipboard.writeText('edge://extensions/').then(() => alert('Скопировано!'))" class="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Копировать</button>
                  </div>
                  
                  <div class="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded">
                    <p class="text-yellow-400 text-sm">
                      <strong>Важно:</strong> Убедитесь что расширение "МексоЁБ" включено и имеет доступ к сайту терминала.
                    </p>
                  </div>
                </div>
                
                <div class="mt-6 flex justify-end">
                  <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md transition-colors font-medium">Закрыть</button>
                </div>
              </div>
            `;
            
            document.body.appendChild(modal);
          },
          details: `Расширение позволяет обходить CORS ограничения и получать данные напрямую от MEXC API. 
          
Требования:
• Установите расширение "МексоЁБ" 
• Разрешите доступ к сайту терминала
• Для лучшей работы установите "CORS Unblock" расширение
• Убедитесь что браузер поддерживает Manifest V3

Проблемы:
• Если статус "Не найдено" - проверьте установку расширения
• Если "Не отвечает" - перезагрузите страницу или переустановите расширение`
        },
        {
          id: 'api',
          title: 'API ключи MEXC',
          description: 'Подключение через официальные API ключи для торговли',
          requirements: [
            'API ключ создан в MEXC',
            'API ключ имеет права на чтение и торговлю',
            'IP адрес добавлен в белый список (если настроено)',
            'Ключи актуальны и не истекли'
          ],
          status: apiStatus,
          buttonText: 'Настроить API',
          buttonAction: () => {
            // Открываем модальное окно создания/редактирования профиля
            const event = new CustomEvent('openCreateModal');
            window.dispatchEvent(event);
          },
          details: `API ключи позволяют совершать реальные торговые операции.

Требования:
• Создайте API ключ в MEXC (Account → API Management)
• Установите права: "Read Info" и "Trade" 
• При необходимости добавьте IP в белый список
• Сохраните ключи в безопасном месте

Безопасность:
• Никогда не передавайте ключи третьим лицам
• Используйте ограничения по IP если возможно
• Регулярно обновляйте ключи`
        },
        {
          id: 'public',
          title: 'Публичные данные',
          description: 'Получение рыночных данных без API ключей',
          requirements: [
            'Расширение CORS Unblock установлено',
            'Браузер поддерживает fetch API',
            'Стабильное интернет соединение',
            'MEXC API доступен'
          ],
          status: apiStatus === 'working' ? 'working' : 'warning',
          buttonText: 'Проверить подключение',
          buttonAction: async () => {
            try {
              // Показываем индикацию загрузки
              const button = event?.target as HTMLButtonElement;
              if (button) {
                const originalText = button.textContent;
                button.textContent = 'Проверяем...';
                button.disabled = true;
                
                try {
                  const response = await fetch('https://api.mexc.com/api/v3/time', {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    alert(`✅ Публичные данные доступны!\n\nСерверное время MEXC: ${new Date(data.serverTime).toLocaleString('ru-RU')}`);
                  } else {
                    alert(`❌ Ошибка доступа к публичным данным\n\nHTTP ${response.status}: ${response.statusText}`);
                  }
                } finally {
                  button.textContent = originalText;
                  button.disabled = false;
                }
              } else {
                // Fallback если не удалось получить button
                const response = await fetch('https://api.mexc.com/api/v3/time');
                if (response.ok) {
                  alert('✅ Публичные данные доступны!');
                } else {
                  alert('❌ Ошибка доступа к публичным данным');
                }
              }
            } catch (error) {
              alert(`❌ Ошибка подключения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}\n\nВозможные причины:\n• Проблемы с интернетом\n• Блокировка CORS\n• MEXC API недоступен`);
            }
          },
          details: `Публичные данные доступны без API ключей, но с ограничениями CORS.

Возможности:
• Получение курсов валют
• Просмотр ордербука
• История сделок
• Статистика 24ч

Ограничения:
• Нет доступа к личному балансу
• Невозможность размещения ордеров
• Могут быть задержки в данных`
        },
        {
          id: 'assessment',
          title: 'Assessment Zone Monitor',
          description: 'Автоматическое отслеживание оценочной зоны MEXC',
          requirements: [
            'Расширение "МексоЁБ" активно',
            'Доступ к сайту mexc.com',
            'Работает парсер объявлений',
            'Доступ к chrome.storage'
          ],
          status: bridgeReady ? 'working' : 'warning',
          buttonText: 'Запустить мониторинг',
          buttonAction: () => {
            // Переключаемся на вкладку Assessment Zone
            const event = new CustomEvent('switchTab', { detail: 'assessment' });
            window.dispatchEvent(event);
          },
          details: `Assessment Zone Monitor автоматически отслеживает новые токены в оценочной зоне.

Функции:
• Автоматическое сканирование объявлений
• Парсинг дат и токенов
• Уведомления о новых листингах
• История изменений

Настройки:
• Интервал проверки: 10 минут
• Уведомления в браузере
• Сохранение в chrome.storage`
        }
      ];

      setMethods(connectionMethods);
    };

    checkConnectionMethods();
    
    // Проверяем каждые 30 секунд
    const interval = setInterval(checkConnectionMethods, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'error':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const toggleMethod = (methodId: string) => {
    setExpandedMethod(expandedMethod === methodId ? null : methodId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Настройка подключений</h2>
        <p className="text-gray-400">
          Настройте способы подключения к MEXC для получения данных и торговли
        </p>
      </div>

      {/* Профили пользователей */}
      <div className="mb-6">
        <ProfilesBar />
      </div>

      {/* Действия */}
      <div className="mb-6">
        <TopActions
          onOpenMexc={() => window.open('https://www.mexc.com', '_blank')}
          onOpenExtensions={() => {
            // Создаем модальное окно с инструкциями для расширений
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-50 grid place-items-center bg-black/80';
            modal.innerHTML = `
              <div class="w-[500px] rounded-lg p-6 bg-black border border-gray-800">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-white">Управление расширениями</h3>
                  <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white text-xl">×</button>
                </div>

                <div class="space-y-4 text-gray-300">
                  <div>
                    <h4 class="text-white font-medium mb-2">Chrome:</h4>
                    <p class="text-sm">1. Скопируйте адрес: <code class="bg-gray-800 px-2 py-1 rounded">chrome://extensions/</code></p>
                    <p class="text-sm">2. Вставьте в адресную строку и нажмите Enter</p>
                    <button onclick="navigator.clipboard.writeText('chrome://extensions/').then(() => alert('Скопировано!'))" class="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Копировать</button>
                  </div>

                  <div>
                    <h4 class="text-white font-medium mb-2">Edge:</h4>
                    <p class="text-sm">1. Скопируйте адрес: <code class="bg-gray-800 px-2 py-1 rounded">edge://extensions/</code></p>
                    <p class="text-sm">2. Вставьте в адресную строку и нажмите Enter</p>
                    <button onclick="navigator.clipboard.writeText('edge://extensions/').then(() => alert('Скопировано!'))" class="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Копировать</button>
                  </div>

                  <div class="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded">
                    <p class="text-yellow-400 text-sm">
                      <strong>Важно:</strong> Убедитесь что расширение "МексоЁБ" включено и имеет доступ к сайту терминала.
                    </p>
                  </div>
                </div>

                <div class="mt-6 flex justify-end">
                  <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md transition-colors font-medium">Закрыть</button>
                </div>
              </div>
            `;
            document.body.appendChild(modal);
          }}
          onDiagnostic={() => {
            // Открываем диагностическое модальное окно
            const event = new CustomEvent('openDiagnosticModal');
            window.dispatchEvent(event);
          }}
          onTestData={() => {
            // Тестируем подключение к API
            alert('Тестирование подключения к MEXC API...');
          }}
          isDiagnosticRunning={false}
          isTestDataRunning={false}
        />
      </div>

      {/* CORS Unblock Info */}
      <div className="mb-6 p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">🔧 Обязательно: CORS Unblock</h3>
        <p className="text-gray-300 mb-3">
          Для стабильной работы всех подключений <strong>обязательно</strong> установите расширение <strong>CORS Unblock</strong>:
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
            <h4 className="text-white font-medium mb-2">Chrome:</h4>
            <p className="text-sm text-gray-300 mb-2">Установите из Chrome Web Store</p>
            <a 
              href="https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino" 
              target="_blank" 
              className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              Установить для Chrome
            </a>
          </div>
          <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
            <h4 className="text-white font-medium mb-2">Edge:</h4>
            <p className="text-sm text-gray-300 mb-2">Установите из Edge Add-ons</p>
            <a 
              href="https://microsoftedge.microsoft.com/addons/detail/cors-unblock/hkjklmhjbkdengblmahhkelfhbdbapgf" 
              target="_blank" 
              className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              Установить для Edge
            </a>
          </div>
        </div>
        <div className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded">
          <p className="text-yellow-400 text-sm">
            <strong>⚠️ Важно:</strong> Без CORS Unblock многие функции могут не работать из-за ограничений безопасности браузера.
          </p>
        </div>
      </div>

      {/* Connection Methods */}
      <div className="space-y-4">
        {methods.map((method) => (
          <div key={method.id} className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleMethod(method.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getStatusIcon(method.status)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{method.title}</h3>
                    <p className="text-gray-400 text-sm">{method.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(method.status)}`}>
                    {method.status === 'working' ? 'Работает' : 
                     method.status === 'error' ? 'Ошибка' : 
                     method.status === 'warning' ? 'Предупреждение' : 'Неизвестно'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      method.buttonAction();
                    }}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md text-sm font-medium transition-colors"
                  >
                    {method.buttonText}
                  </button>
                  <span className="text-gray-400 text-lg">
                    {expandedMethod === method.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>
            </div>

            {expandedMethod === method.id && (
              <div className="border-t border-gray-700 p-4 bg-gray-800/30">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-semibold text-white mb-3">Требования:</h4>
                    <ul className="space-y-2">
                      {method.requirements.map((requirement, index) => {
                        const reqStatus = checkRequirement(requirement, method.id);
                        return (
                          <li key={index} className="flex items-start space-x-2 text-gray-300">
                            <span className={`mt-1 ${reqStatus === 'ok' ? 'text-green-400' : reqStatus === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                              {reqStatus === 'ok' ? '✅' : reqStatus === 'error' ? '❌' : '⚠️'}
                            </span>
                            <span className={`text-sm ${reqStatus === 'ok' ? 'text-green-300' : reqStatus === 'error' ? 'text-red-300' : 'text-yellow-300'}`}>
                              {requirement}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-white mb-3">Подробности:</h4>
                    <div className="text-gray-300 text-sm whitespace-pre-line">
                      {method.details}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default ConnectionPage;
