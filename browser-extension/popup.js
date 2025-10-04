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
      // Проверяем доступность API MEXC
      const response = await fetch('https://api.mexc.com/api/v3/time');
      if (response.ok) {
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = 'Подключено';
        versionStatus.textContent = 'Активно';
      } else {
        statusIndicator.className = 'status-indicator degraded';
        statusText.textContent = 'Проблемы с API';
        versionStatus.textContent = 'Частично работает';
      }
    } catch (error) {
      statusIndicator.className = 'status-indicator';
      statusText.textContent = 'Не подключено';
      versionStatus.textContent = 'Ошибка подключения';
    }
  };

  // Обработчики кнопок
  diagnosticBtn.addEventListener('click', () => {
    // Открываем диагностику в новой вкладке
    chrome.tabs.create({ url: chrome.runtime.getURL('diagnostic.html') });
  });

  refreshBtn.addEventListener('click', () => {
    checkStatus();
  });

  // Проверяем статус при загрузке
  checkStatus();
});