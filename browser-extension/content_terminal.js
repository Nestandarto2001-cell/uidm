console.info('[TERMINAL CS] init at', location.href);

let port = null;
let messageCount = 0;

// Подключение к background script
function connectPort() {
  try {
    port = chrome.runtime.connect({ name: 'terminal' });
    
    port.onDisconnect.addListener(() => {
      console.warn('[TERMINAL CS] Port disconnected');
      port = null;
      // Ретрай подключения
      setTimeout(connectPort, 1000);
    });

    // Отправляем HELLO сообщение
    port.postMessage({ type: 'HELLO' });
    console.info('[TERMINAL CS] Connected to background script');
    
  } catch (error) {
    console.error('[TERMINAL CS] Failed to connect:', error);
    setTimeout(connectPort, 2000);
  }
}

// Обработка сообщений от background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.info('[TERMINAL CS] Received message:', message);
  messageCount++;
  
  switch (message.type) {
    case 'PING':
      sendResponse({ type: 'PONG', timestamp: Date.now() });
      break;
      
    case 'DEBUG_DUMP':
      const debugInfo = {
        type: 'DEBUG_DUMP_RESPONSE',
        payload: {
          url: window.location.href,
          messageCount,
          portConnected: !!port,
          timestamp: Date.now()
        }
      };
      sendResponse(debugInfo);
      break;
      
    case 'ORDERBOOK_DATA':
      // Пересылаем данные ордербука в терминал
      window.postMessage({
        type: 'MEXC_ORDERBOOK_DATA',
        payload: message.payload
      }, '*');
      break;
  }
  
  return true;
});

// Слушаем сообщения от терминала
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'MEXC_TERMINAL_MESSAGE' && port) {
    try {
      port.postMessage(event.data.payload);
    } catch (error) {
      console.error('[TERMINAL CS] Failed to forward message:', error);
    }
  }
});

// Инициализация
connectPort();

console.info('[TERMINAL CS] Content script initialized');
