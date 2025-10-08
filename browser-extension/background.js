/**
 * Background Service Worker для MEXC Trading Terminal
 * Обрабатывает все сетевые запросы к MEXC API
 */

console.log('[Background] MEXC Trading Terminal background script loaded');

// Обработчик сообщений от content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message);
  
  if (message.source === 'MEXC_TT') {
    handleExtensionMessage(message, sender, sendResponse);
    return true; // Указываем, что ответ будет асинхронным
  }
});

// Обработка сообщений от расширения
async function handleExtensionMessage(message, sender, sendResponse) {
  try {
    let response;
    
    switch (message.type) {
      case 'PING':
        response = 'PONG';
        break;
        
      case 'PROBE':
        response = await probeMEXCAPI();
        break;
        
      case 'GET_ORDERBOOK':
        response = await getOrderBook(message.payload.symbol);
        break;
        
      case 'GET_BALANCE':
        response = await getAccountBalance();
        break;
        
      case 'GET_SYMBOLS':
        response = await getSymbols();
        break;
        
      case 'GET_TICKER':
        response = await getTicker(message.payload.symbol);
        break;
        
      case 'PLACE_ORDER':
        response = await placeOrder(message.payload);
        break;
        
      case 'CANCEL_ORDER':
        response = await cancelOrder(message.payload.orderId);
        break;
        
      default:
        response = { error: 'Unknown message type' };
    }
    
    // Отправляем ответ обратно
    sendResponse({
      source: 'MEXC_TT',
      type: message.type + '_RESPONSE',
      payload: response,
      id: message.id
    });
    
  } catch (error) {
    console.error('[Background] Error handling message:', error);
    sendResponse({
      source: 'MEXC_TT',
      type: message.type + '_ERROR',
      error: error.message,
      id: message.id
    });
  }
}

// Проверка доступности MEXC API
async function probeMEXCAPI() {
  try {
    const response = await fetch('https://api.mexc.com/api/v3/time');
    if (response.ok) {
      const data = await response.json();
      return { type: 'PROBE_OK', serverTime: data.serverTime };
    } else {
      return { type: 'PROBE_ERROR', error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { type: 'PROBE_ERROR', error: error.message };
  }
}

// Получение ордербука
async function getOrderBook(symbol) {
  try {
    const response = await fetch(`https://api.mexc.com/api/v3/depth?symbol=${symbol}&limit=100`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`Failed to get order book: ${error.message}`);
  }
}

// Получение баланса аккаунта
async function getAccountBalance() {
  try {
    // Возвращаем моковые данные для демонстрации
    return {
      balances: [
        { asset: 'USDT', free: '1000.00', locked: '0.00' },
        { asset: 'BTC', free: '0.05', locked: '0.00' }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to get balance: ${error.message}`);
  }
}

// Получение списка символов
async function getSymbols() {
  try {
    const response = await fetch('https://api.mexc.com/api/v3/exchangeInfo');
    if (response.ok) {
      const data = await response.json();
      return data.symbols;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`Failed to get symbols: ${error.message}`);
  }
}

// Получение тикера
async function getTicker(symbol) {
  try {
    const response = await fetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}`);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`Failed to get ticker: ${error.message}`);
  }
}

// Размещение ордера
async function placeOrder(orderData) {
  try {
    // Возвращаем моковый ответ
    return {
      orderId: Date.now().toString(),
      symbol: orderData.symbol,
      side: orderData.side,
      type: orderData.type,
      status: 'pending'
    };
  } catch (error) {
    throw new Error(`Failed to place order: ${error.message}`);
  }
}

// Отмена ордера
async function cancelOrder(orderId) {
  try {
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
}

// Отправка heartbeat сообщений
setInterval(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes('localhost:3001')) {
        chrome.tabs.sendMessage(tab.id, {
          source: 'MEXC_TT',
          type: 'MEXC_HEARTBEAT',
          timestamp: Date.now()
        }).catch(() => {
          // Игнорируем ошибки для вкладок без content script
        });
      }
    });
  });
}, 5000);

console.log('[Background] MEXC Trading Terminal background script loaded');