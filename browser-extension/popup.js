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
      // Открываем GitHub репозиторий с инструкциями
      await chrome.tabs.create({ 
        url: 'https://github.com/Nestandarto2001-cell/uidm#%D0%B1%D1%8B%D1%81%D1%82%D1%80%D1%8B%D0%B9-%D1%81%D1%82%D0%B0%D1%80%D1%82' 
      });
      
      // Показываем инструкции
      statusText.textContent = 'Инструкции открыты';
      versionStatus.textContent = 'Запустите: npm run dev';
      
      // Закрываем popup через 3 секунды
      setTimeout(() => {
        window.close();
      }, 3000);
    } catch (error) {
      console.error('Error opening instructions:', error);
    }
  });

  // Проверяем статус при загрузке
  checkStatus();
});