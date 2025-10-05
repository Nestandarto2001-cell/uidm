// Popup script для расширения MEXC Trading Helper

document.addEventListener('DOMContentLoaded', async () => {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const versionStatus = document.getElementById('versionStatus');
  const diagnosticBtn = document.getElementById('diagnosticBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  // Проверяем статус расширения
  const checkStatus = async () => {
    try {
      statusText.textContent = 'Проверка...';
      
      // Проверяем доступность API MEXC
      const response = await fetch('https://api.mexc.com/api/v3/time');
      if (response.ok) {
        const data = await response.json();
        
        // Проверяем доступность локального сервера
        const checkDevServer = async (port) => {
          try {
            const serverResponse = await fetch(`http://localhost:${port}`, { 
              method: 'HEAD',
              mode: 'no-cors',
              timeout: 2000
            });
            return true;
          } catch (error) {
            return false;
          }
        };

        const ports = [3002, 3001, 3009, 5173, 3000, 8080, 4173, 3003, 3004, 3005, 3006, 3007, 3008];
        let serverRunning = false;
        let workingPort = null;

        for (const port of ports) {
          if (await checkDevServer(port)) {
            serverRunning = true;
            workingPort = port;
            break;
          }
        }

        if (serverRunning) {
          statusIndicator.className = 'status-indicator connected';
          statusText.textContent = `Подключено (порт ${workingPort})`;
          versionStatus.textContent = 'Сервер запущен';
          
          // Проверяем наличие вкладок терминала
          const tabs = await chrome.tabs.query({ url: ['http://localhost/*', 'http://127.0.0.1/*'] });
          if (tabs.length > 0) {
            statusText.textContent = `Подключено (${tabs.length} вкладок)`;
          }
        } else {
          statusIndicator.className = 'status-indicator degraded';
          statusText.textContent = 'API доступен, сервер не запущен';
          versionStatus.textContent = 'Запустите npm run dev';
        }
      } else {
        statusIndicator.className = 'status-indicator degraded';
        statusText.textContent = 'Проблемы с API';
        versionStatus.textContent = 'Частично работает';
      }
    } catch (error) {
      statusIndicator.className = 'status-indicator';
      statusText.textContent = 'Не подключено';
      versionStatus.textContent = 'Ошибка подключения';
      console.error('Status check error:', error);
    }
  };

  // Обработчики кнопок
  diagnosticBtn.addEventListener('click', async () => {
    // Добавляем визуальную индикацию
    diagnosticBtn.textContent = 'Проверка...';
    diagnosticBtn.disabled = true;
    diagnosticBtn.style.opacity = '0.6';
    
    try {
      // Получаем активную вкладку терминала
      const tabs = await chrome.tabs.query({ url: ['http://localhost/*', 'http://127.0.0.1/*'] });
      
      if (tabs.length > 0) {
        // Открываем диагностику в существующей вкладке терминала
        await chrome.tabs.sendMessage(tabs[0].id, { 
          type: 'OPEN_DIAGNOSTIC',
          source: 'EXTENSION_POPUP'
        });
        
        // Показываем успешное сообщение
        statusText.textContent = 'Диагностика запущена!';
        versionStatus.textContent = 'Проверьте терминал';
        
        // Восстанавливаем кнопку
        diagnosticBtn.textContent = 'Диагностика';
        diagnosticBtn.disabled = false;
        diagnosticBtn.style.opacity = '1';
        
        // НЕ закрываем popup, чтобы пользователь видел результат
                  } else {
                    // Проверяем доступность сервера перед открытием
                    const checkDevServer = async (port) => {
                      try {
                        const response = await fetch(`http://localhost:${port}`, {
                          method: 'HEAD',
                          mode: 'no-cors',
                          timeout: 2000
                        });
                        return true;
                      } catch (error) {
                        return false;
                      }
                    };

                    const ports = [3002, 3001, 3009, 5173, 3000, 8080, 4173, 3003, 3004, 3005, 3006, 3007, 3008];
                    let workingPort = null;

                    for (const port of ports) {
                      if (await checkDevServer(port)) {
                        workingPort = port;
                        break;
                      }
                    }

                    if (workingPort) {
                      await chrome.tabs.create({ url: `http://localhost:${workingPort}` });
                      
                      // Показываем успешное сообщение
                      statusText.textContent = 'Терминал открыт!';
                      versionStatus.textContent = 'Проверьте новую вкладку';
                      
                      // Восстанавливаем кнопку
                      diagnosticBtn.textContent = 'Диагностика';
                      diagnosticBtn.disabled = false;
                      diagnosticBtn.style.opacity = '1';
                    } else {
                      // Если сервер не запущен, показываем инструкции
                      statusText.textContent = 'Сервер не запущен!';
                      versionStatus.textContent = 'Запустите npm run dev';
                      
                      // Восстанавливаем кнопку
                      diagnosticBtn.textContent = 'Диагностика';
                      diagnosticBtn.disabled = false;
                      diagnosticBtn.style.opacity = '1';
                    }

                    // НЕ закрываем popup, чтобы пользователь видел результат
                  }
                } catch (error) {
                  console.error('Error opening diagnostic:', error);
                  statusText.textContent = 'Ошибка подключения';
                  versionStatus.textContent = 'Проверьте сервер';
                  
                  // Восстанавливаем кнопку
                  diagnosticBtn.textContent = 'Диагностика';
                  diagnosticBtn.disabled = false;
                  diagnosticBtn.style.opacity = '1';
                }
              });

  refreshBtn.addEventListener('click', () => {
    checkStatus();
  });

  // Кнопка открытия терминала
  const openTerminalBtn = document.getElementById('openTerminalBtn');
  openTerminalBtn.addEventListener('click', async () => {
    try {
      // Проверяем доступность localhost:5173
      const checkDevServer = async (port) => {
        try {
          const response = await fetch(`http://localhost:${port}`, { 
            method: 'HEAD',
            mode: 'no-cors',
            timeout: 2000
          });
          return true;
        } catch (error) {
          return false;
        }
      };

      // Проверяем разные порты (включая 3009 где запустился сервер)
              const ports = [3002, 3001, 3009, 5173, 3000, 8080, 4173, 3003, 3004, 3005, 3006, 3007, 3008];
      let workingPort = null;

      for (const port of ports) {
        if (await checkDevServer(port)) {
          workingPort = port;
          break;
        }
      }

      if (workingPort) {
        await chrome.tabs.create({ url: `http://localhost:${workingPort}` });
      } else {
        // Если сервер не запущен, открываем GitHub репозиторий с инструкциями
        await chrome.tabs.create({ 
          url: 'https://github.com/Nestandarto2001-cell/uidm' 
        });
        
        // Показываем уведомление
        statusText.textContent = 'Сервер не запущен!';
        versionStatus.textContent = 'Запустите npm run dev';
      }
      
      window.close();
    } catch (error) {
      console.error('Error opening terminal:', error);
      // Fallback: открываем GitHub
      chrome.tabs.create({ url: 'https://github.com/Nestandarto2001-cell/uidm' });
      window.close();
    }
  });

  // Кнопка запуска сервера
  const startServerBtn = document.getElementById('startServerBtn');
  startServerBtn.addEventListener('click', async () => {
    try {
      statusText.textContent = 'Запуск сервера...';
      versionStatus.textContent = 'Открываем терминал';
      
      // Создаем HTML страницу с автоматическим запуском сервера
      const autoStartPage = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>МексоЁБ - Автозапуск</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background: #000000;
              color: #ffffff;
              margin: 0;
              padding: 40px 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
              font-weight: 400;
              letter-spacing: -0.01em;
            }
            .container {
              max-width: 480px;
              padding: 48px;
              background: #0a0a0a;
              border: 1px solid #1a1a1a;
              border-radius: 16px;
            }
            .logo {
              font-size: 24px;
              font-weight: 600;
              color: #ffffff;
              margin-bottom: 32px;
              letter-spacing: -0.02em;
            }
            .status {
              padding: 20px;
              background: #0a0a0a;
              border: 1px solid #1a1a1a;
              border-radius: 12px;
              margin: 24px 0;
              color: #ffffff;
              font-weight: 500;
            }
            .command {
              background: #0a0a0a;
              border: 1px solid #1a1a1a;
              border-radius: 8px;
              padding: 20px;
              font-family: 'SF Mono', 'Monaco', monospace;
              font-size: 13px;
              color: #ffffff;
              margin: 20px 0;
              word-break: break-all;
              font-weight: 500;
            }
            .copy-btn {
              background: #ffffff;
              color: #000000;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              margin-left: 12px;
              transition: all 0.15s ease;
            }
            .copy-btn:hover {
              background: #f0f0f0;
            }
            .instructions {
              text-align: left;
              margin: 20px 0;
              line-height: 1.6;
            }
            .instructions ol {
              margin: 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
            }
            .auto-redirect {
              color: #fbbf24;
              font-weight: bold;
              margin-top: 20px;
            }
            .countdown {
              font-size: 1.5rem;
              color: #ef4444;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">МексоЁБ</div>
            
            <div class="status">
              <strong>Автоматический запуск сервера</strong><br>
              Выполните команду ниже в терминале:
            </div>
            
            <div class="command" id="command">
              cd "C:\\Users\\nesta\\YandexDisk\\! Проекты (1)\\Cursor\\Test bot" && npm run dev
              <button class="copy-btn" onclick="copyCommand()">Копировать</button>
            </div>
            
                        <div class="instructions">
                          <strong>Инструкции:</strong>
                          <ol>
                            <li>Скопируйте команду выше</li>
                            <li>Откройте терминал (PowerShell/CMD)</li>
                            <li>Вставьте и выполните команду</li>
                            <li>Дождитесь сообщения "Local: http://localhost:XXXX" (любой порт)</li>
                            <li>Страница автоматически перенаправится на терминал</li>
                          </ol>
                          
                          <div style="margin-top: 16px; padding: 12px; background: #1a1a1a; border: 1px solid #333; border-radius: 6px;">
                            <strong style="color: #60a5fa;">🔧 Рекомендация:</strong>
                            <p style="margin: 8px 0; font-size: 13px;">
                              Для стабильной работы установите расширение <strong>CORS Unblock</strong>:
                            </p>
                            <ul style="margin: 8px 0; padding-left: 16px; font-size: 13px;">
                              <li>Chrome: <a href="https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino" target="_blank" style="color: #60a5fa;">CORS Unblock</a></li>
                              <li>Edge: <a href="https://microsoftedge.microsoft.com/addons/detail/cors-unblock/hkjklmhjbkdengblmahhkelfhbdbapgf" target="_blank" style="color: #60a5fa;">CORS Unblock</a></li>
                            </ul>
                          </div>
                        </div>
            
            <div class="auto-redirect">
              <div id="redirectStatus">Ожидание запуска сервера...</div>
              <div class="countdown" id="countdown">--</div>
            </div>
          </div>
          
          <script>
            let countdown = 30;
            let redirectTimer = null;
            let checkInterval = null;
            
            function copyCommand() {
              const command = document.getElementById('command').textContent.replace('Копировать', '').trim();
              const copyBtn = document.querySelector('.copy-btn');
              
              // Пробуем разные способы копирования
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(command).then(() => {
                  showCopySuccess(copyBtn);
                }).catch(() => {
                  fallbackCopy(command, copyBtn);
                });
              } else {
                fallbackCopy(command, copyBtn);
              }
              
              function fallbackCopy(text, btn) {
                // Fallback метод копирования
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                  document.execCommand('copy');
                  showCopySuccess(btn);
                } catch (err) {
                  showCopyError(btn);
                  textArea.select();
                }
                
                document.body.removeChild(textArea);
              }
              
              function showCopySuccess(btn) {
                if (btn) {
                  const originalText = btn.textContent;
                  btn.textContent = 'Скопировано!';
                  btn.style.background = '#10b981';
                  btn.style.color = '#ffffff';
                  
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#ffffff';
                    btn.style.color = '#000000';
                  }, 2000);
                }
              }
              
              function showCopyError(btn) {
                if (btn) {
                  const originalText = btn.textContent;
                  btn.textContent = 'Ошибка!';
                  btn.style.background = '#ef4444';
                  btn.style.color = '#ffffff';
                  
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#ffffff';
                    btn.style.color = '#000000';
                  }, 2000);
                }
              }
            }
            
            function checkServer() {
              // Проверяем разные порты
              const ports = [3002, 3001, 3009, 5173, 3000, 8080, 4173, 3003, 3004, 3005, 3006, 3007, 3008];
              
              const checkPort = async (port) => {
                try {
                  // Используем более надежную проверку
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 2000);
                  
                  await fetch(\`http://localhost:\${port}\`, { 
                    method: 'HEAD', 
                    mode: 'no-cors',
                    signal: controller.signal
                  });
                  
                  clearTimeout(timeoutId);
                  console.log(\`Server found on port \${port}\`);
                  return port;
                } catch (error) {
                  return null;
                }
              };
              
              // Проверяем все порты последовательно для лучшей производительности
              const checkPortsSequentially = async () => {
                for (const port of ports) {
                  const result = await checkPort(port);
                  if (result) {
                    const statusEl = document.getElementById('redirectStatus');
                    const countdownEl = document.getElementById('countdown');
                    
                    statusEl.textContent = \`Сервер запущен на порту \${result}! Перенаправление...\`;
                    countdownEl.textContent = 'Переход...';
                    
                    clearInterval(checkInterval);
                    clearTimeout(redirectTimer);
                    
                    setTimeout(() => {
                      window.location.href = \`http://localhost:\${result}\`;
                    }, 1000);
                    
                    return;
                  }
                }
                
                // Если сервер не найден, обновляем счетчик
                const countdownEl = document.getElementById('countdown');
                if (countdown > 0) {
                  countdownEl.textContent = countdown;
                }
              };
              
              checkPortsSequentially();
            }
            
            function updateCountdown() {
              const countdownEl = document.getElementById('countdown');
              if (countdown > 0) {
                countdownEl.textContent = countdown;
                countdown--;
              } else {
                countdownEl.textContent = 'Время вышло';
                document.getElementById('redirectStatus').textContent = 'Нажмите кнопку "Открыть терминал" в расширении';
                clearInterval(checkInterval);
                clearTimeout(redirectTimer);
              }
            }
            
            // Проверяем сервер каждые 2 секунды
            checkInterval = setInterval(checkServer, 2000);
            
            // Обновляем счетчик каждую секунду
            redirectTimer = setInterval(updateCountdown, 1000);
            
            // Первая проверка
            checkServer();
          </script>
        </body>
        </html>
      `;
      
      // Создаем blob URL для HTML страницы
      const blob = new Blob([autoStartPage], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Открываем страницу с автоматическим запуском
      await chrome.tabs.create({ url: url });
      
      // Закрываем popup
      window.close();
      
    } catch (error) {
      console.error('Error creating auto-start page:', error);
      
      // Fallback: открываем GitHub
      await chrome.tabs.create({ 
        url: 'https://github.com/Nestandarto2001-cell/uidm#%D0%B1%D1%8B%D1%81%D1%82%D1%80%D1%8B%D0%B9-%D1%81%D1%82%D0%B0%D1%80%D1%82' 
      });
      
      statusText.textContent = 'Ошибка создания страницы';
      versionStatus.textContent = 'Открыты инструкции';
      
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  });

  // Функциональность второй кнопки объединена в startServerBtn

  // Проверяем статус при загрузке
  checkStatus();
});