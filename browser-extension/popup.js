// Popup script для расширения
document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const connectBtn = document.getElementById('connectBtn');
  const openMexcBtn = document.getElementById('openMexcBtn');

  // Проверяем статус подключения
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('mexc.com')) {
      statusDiv.className = 'status connected';
      statusDiv.textContent = 'Подключен к MEXC';
      connectBtn.textContent = 'Отключиться';
    }
  });

  // Обработчик кнопки подключения
  connectBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        if (tabs[0].url && tabs[0].url.includes('mexc.com')) {
          // Отправляем сообщение для отключения
          chrome.tabs.sendMessage(tabs[0].id, {type: 'TOGGLE_CONNECTION'});
        } else {
          // Открываем MEXC
          chrome.tabs.create({url: 'https://www.mexc.com'});
        }
      }
    });
  });

  // Обработчик кнопки открытия MEXC
  openMexcBtn.addEventListener('click', () => {
    chrome.tabs.create({url: 'https://www.mexc.com'});
  });
});
