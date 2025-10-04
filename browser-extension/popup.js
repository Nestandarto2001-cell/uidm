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

        const ports = [5173, 3000, 8080, 4173];
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
    try {
      // Получаем активную вкладку терминала
      const tabs = await chrome.tabs.query({ url: ['http://localhost/*', 'http://127.0.0.1/*'] });
      
      if (tabs.length > 0) {
        // Открываем диагностику в существующей вкладке терминала
        await chrome.tabs.sendMessage(tabs[0].id, { 
          type: 'OPEN_DIAGNOSTIC',
          source: 'EXTENSION_POPUP'
        });
        
        // Закрываем popup
        window.close();
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

        const ports = [5173, 3000, 8080, 4173];
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
          // Если сервер не запущен, показываем инструкции
          statusText.textContent = 'Сервер не запущен!';
          versionStatus.textContent = 'Запустите npm run dev';
          return; // Не закрываем popup, чтобы пользователь увидел сообщение
        }
        
        window.close();
      }
    } catch (error) {
      console.error('Error opening diagnostic:', error);
      statusText.textContent = 'Ошибка подключения';
      versionStatus.textContent = 'Проверьте сервер';
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

      // Проверяем разные порты
      const ports = [5173, 3000, 8080, 4173];
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
          <title>MEXC Terminal - Auto Start</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #0f172a;
              color: #e2e8f0;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
            }
            .container {
              max-width: 600px;
              padding: 40px;
              background: #1e293b;
              border: 1px solid #334155;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .logo {
              font-size: 2rem;
              color: #00aaff;
              margin-bottom: 20px;
            }
            .status {
              padding: 16px;
              background: #065f46;
              border: 1px solid #10b981;
              border-radius: 8px;
              margin: 20px 0;
              color: #d1fae5;
            }
            .command {
              background: #1f2937;
              border: 1px solid #374151;
              border-radius: 6px;
              padding: 16px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              color: #fbbf24;
              margin: 16px 0;
              word-break: break-all;
            }
            .copy-btn {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin-left: 8px;
            }
            .copy-btn:hover {
              background: #2563eb;
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
            <div class="logo">🚀 MEXC Trading Terminal</div>
            
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
                <li>Дождитесь сообщения "Local: http://localhost:5173"</li>
                <li>Страница автоматически перенаправится на терминал</li>
              </ol>
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
              navigator.clipboard.writeText(command).then(() => {
                alert('Команда скопирована!');
              });
            }
            
            function checkServer() {
              fetch('http://localhost:5173', { method: 'HEAD', mode: 'no-cors' })
                .then(() => {
                  document.getElementById('redirectStatus').textContent = 'Сервер запущен! Перенаправление...';
                  clearInterval(checkInterval);
                  clearTimeout(redirectTimer);
                  setTimeout(() => {
                    window.location.href = 'http://localhost:5173';
                  }, 1000);
                })
                .catch(() => {
                  // Сервер еще не запущен
                });
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

  // Кнопка "Открыть терминал + команда"
  const openTerminalWithCmdBtn = document.getElementById('openTerminalWithCmdBtn');
  openTerminalWithCmdBtn.addEventListener('click', async () => {
    try {
      statusText.textContent = 'Открываем терминал...';
      versionStatus.textContent = 'Команда готова';
      
      // Создаем простую страницу с командой
      const cmdPage = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MEXC Terminal - Start Command</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #0f172a;
              color: #e2e8f0;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
            }
            .container {
              max-width: 500px;
              padding: 30px;
              background: #1e293b;
              border: 1px solid #334155;
              border-radius: 12px;
            }
            .logo {
              font-size: 1.5rem;
              color: #00aaff;
              margin-bottom: 20px;
            }
            .command {
              background: #1f2937;
              border: 1px solid #374151;
              border-radius: 6px;
              padding: 16px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              color: #fbbf24;
              margin: 16px 0;
              word-break: break-all;
              cursor: pointer;
              user-select: all;
            }
            .command:hover {
              background: #374151;
            }
            .copy-btn {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              margin: 10px 0;
              width: 100%;
            }
            .copy-btn:hover {
              background: #2563eb;
            }
            .instructions {
              text-align: left;
              margin: 20px 0;
              line-height: 1.6;
              font-size: 14px;
            }
            .instructions ol {
              margin: 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🚀 MEXC Terminal</div>
            
            <div style="margin-bottom: 20px;">
              <strong>Команда для запуска сервера:</strong>
            </div>
            
            <div class="command" id="command" onclick="selectAll()">
              cd "C:\\Users\\nesta\\YandexDisk\\! Проекты (1)\\Cursor\\Test bot" && npm run dev
            </div>
            
            <button class="copy-btn" onclick="copyCommand()">📋 Копировать команду</button>
            
            <div class="instructions">
              <strong>Как запустить:</strong>
              <ol>
                <li>Нажмите "Копировать команду"</li>
                <li>Откройте PowerShell или CMD</li>
                <li>Вставьте команду (Ctrl+V)</li>
                <li>Нажмите Enter</li>
                <li>Дождитесь "Local: http://localhost:5173"</li>
                <li>Откройте терминал в браузере</li>
              </ol>
            </div>
          </div>
          
          <script>
            function selectAll() {
              const command = document.getElementById('command');
              const range = document.createRange();
              range.selectNode(command);
              window.getSelection().removeAllRanges();
              window.getSelection().addRange(range);
            }
            
            function copyCommand() {
              const command = document.getElementById('command').textContent;
              navigator.clipboard.writeText(command).then(() => {
                alert('✅ Команда скопирована! Теперь откройте PowerShell и вставьте её.');
              }).catch(() => {
                selectAll();
                alert('Выделите команду выше и скопируйте (Ctrl+C)');
              });
            }
            
            // Автоматически выделяем команду при загрузке
            setTimeout(selectAll, 500);
          </script>
        </body>
        </html>
      `;
      
      // Создаем blob URL
      const blob = new Blob([cmdPage], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Открываем страницу с командой
      await chrome.tabs.create({ url: url });
      
      // Закрываем popup
      window.close();
      
    } catch (error) {
      console.error('Error opening command page:', error);
      
      // Fallback: просто открываем GitHub
      await chrome.tabs.create({ 
        url: 'https://github.com/Nestandarto2001-cell/uidm' 
      });
      
      window.close();
    }
  });

  // Проверяем статус при загрузке
  checkStatus();
});