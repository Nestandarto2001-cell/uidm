/**
 * Content Script для MEXC Trading Terminal
 * Мост между страницей и background script
 */

console.log('[Content] MEXC Trading Terminal content script loaded');

// Слушаем сообщения от страницы
window.addEventListener('message', (event) => {
  if (event.data?.source === 'MEXC_TT') {
    console.log('[Content] Received message from page:', event.data);
    
    // Пересылаем сообщение в background script
    chrome.runtime.sendMessage(event.data, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Content] Error sending message to background:', chrome.runtime.lastError);
        return;
      }
      
      console.log('[Content] Received response from background:', response);
      
      // Отправляем ответ обратно на страницу
      window.postMessage(response, '*');
    });
  }
});

// Слушаем сообщения от background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === 'MEXC_TT') {
    console.log('[Content] Received message from background:', message);
    
    // Пересылаем сообщение на страницу
    window.postMessage(message, '*');
  }
});

// Добавляем мета-тег для определения наличия расширения
const meta = document.createElement('meta');
meta.name = 'mexc-tt-extension';
meta.content = 'loaded';
document.head.appendChild(meta);

// Отправляем сигнал о готовности
window.postMessage({
  source: 'MEXC_TT',
  type: 'EXTENSION_READY',
  timestamp: Date.now()
}, '*');

console.log('[Content] Extension bridge ready');