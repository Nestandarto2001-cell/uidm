/**
 * Content Script - Bridge между страницей и Service Worker
 * Страница ↔ Контент-скрипт ↔ Воркер
 */

const ORIGIN = location.origin;

console.log('[Content Script] Initialized on:', location.href);

// От страницы к воркеру
window.addEventListener('message', async (e) => {
  const msg = e.data;
  if (!msg || msg.source !== 'MEXC_TT') return;

  console.log('[Content Script] Received message from page:', msg);

  if (msg.type === 'PING') {
    window.postMessage({ source: 'MEXC_TT', type: 'PONG' }, ORIGIN);
    console.log('[Content Script] Sent PONG response');
    return;
  }

  // Пересылаем сообщение в service worker
  chrome.runtime.sendMessage(msg, (response) => {
    console.log('[Content Script] Response from worker:', response);
    window.postMessage({ source: 'MEXC_TT', id: msg.id, ...response }, ORIGIN);
  });
});

// Обработка сообщений от popup расширения
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content Script] Received message from popup:', message);
  
  if (message.type === 'OPEN_DIAGNOSTIC') {
    // Отправляем сообщение на страницу для открытия диагностики
    window.postMessage({ 
      source: 'MEXC_TT', 
      type: 'OPEN_DIAGNOSTIC_MODAL',
      fromExtension: true 
    }, ORIGIN);
    
    sendResponse({ success: true });
  }
});

// От воркера к странице (например, пуш-события)
chrome.runtime.onMessage.addListener((msg) => {
  console.log('[Content Script] Received message from worker:', msg);
  window.postMessage({ source: 'MEXC_TT', ...msg }, ORIGIN);
});

// Сообщаем странице, что контент-скрипт жив
window.postMessage({ source: 'MEXC_TT', type: 'EXT_READY' }, ORIGIN);
console.log('[Content Script] Sent EXT_READY signal');