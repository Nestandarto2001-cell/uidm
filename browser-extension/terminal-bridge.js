/**
 * Terminal Bridge - Content Script
 * Мост между страницей React и Service Worker расширения
 */

const BRIDGE_TAG = '__mexc_bridge__';

console.log('[Terminal Bridge] Initializing...');

// Соединяемся с Service Worker
let port = chrome.runtime.connect({ name: 'terminal' });

// Ретрай при отвале соединения
port.onDisconnect.addListener(() => {
  console.log('[Terminal Bridge] Connection lost, retrying...');
  setTimeout(() => {
    try {
      port = chrome.runtime.connect({ name: 'terminal' });
      console.log('[Terminal Bridge] Reconnected');
    } catch (error) {
      console.error('[Terminal Bridge] Failed to reconnect:', error);
    }
  }, 1000);
});

// Из страницы в Service Worker
window.addEventListener('message', (e) => {
  const data = e.data;
  if (!data || data.__tag !== BRIDGE_TAG || data.direction !== 'page->ext') {
    return;
  }
  
  try {
    port.postMessage(data.payload);
    console.log('[Terminal Bridge] Message sent to SW:', data.payload);
  } catch (error) {
    console.error('[Terminal Bridge] Failed to send message:', error);
  }
});

// Из Service Worker в страницу
port.onMessage.addListener((msg) => {
  console.log('[Terminal Bridge] Message received from SW:', msg);
  window.postMessage({
    __tag: BRIDGE_TAG,
    direction: 'ext->page',
    payload: msg
  }, '*');
});

// Сигнал «мост поднялся»
window.postMessage({
  __tag: BRIDGE_TAG,
  direction: 'ext->page',
  payload: { type: 'BRIDGE_READY' }
}, '*');

console.log('[Terminal Bridge] Ready');
