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
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = 'Подключено';
        versionStatus.textContent = 'Активно';
        
        // Проверяем наличие вкладок терминала
        const tabs = await chrome.tabs.query({ url: ['http://localhost/*', 'http://127.0.0.1/*'] });
        if (tabs.length > 0) {
          statusText.textContent = `Подключено (${tabs.length} вкладок)`;
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
        // Если нет открытых вкладок терминала, открываем новую
        await chrome.tabs.create({ url: 'http://localhost:5173' });
        window.close();
      }
    } catch (error) {
      console.error('Error opening diagnostic:', error);
      // Fallback: открываем localhost
      chrome.tabs.create({ url: 'http://localhost:5173' });
      window.close();
    }
  });

  refreshBtn.addEventListener('click', () => {
    checkStatus();
  });

  // Кнопка открытия терминала
  const openTerminalBtn = document.getElementById('openTerminalBtn');
  openTerminalBtn.addEventListener('click', async () => {
    try {
      await chrome.tabs.create({ url: 'http://localhost:5173' });
      window.close();
    } catch (error) {
      console.error('Error opening terminal:', error);
    }
  });

  // Проверяем статус при загрузке
  checkStatus();
});