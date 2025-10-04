console.info('[MEXC CS] init at', location.href);

// Fallback селекторы для ордербука
const ORDERBOOK_SELECTORS = [
  // Основные селекторы MEXC
  '.orderbook-table tbody tr',
  '.order-book-table tbody tr',
  '[data-testid="orderbook"] tbody tr',
  '.orderbook tbody tr',
  // Fallback селекторы
  'table tbody tr',
  '.table tbody tr',
  '[class*="orderbook"] tbody tr',
  '[class*="order-book"] tbody tr',
  // Общие селекторы
  'tr[class*="order"]',
  'tr[data-testid*="order"]'
];

const ASK_SELECTORS = [
  '.ask-row',
  '.sell-row',
  '[class*="ask"]',
  '[class*="sell"]',
  'tr:has(.price-down)',
  'tr:has([class*="red"])'
];

const BID_SELECTORS = [
  '.bid-row',
  '.buy-row',
  '[class*="bid"]',
  '[class*="buy"]',
  'tr:has(.price-up)',
  'tr:has([class*="green"])'
];

let port = null;
let messageCount = 0;
let lastOrderBookTime = null;
let selectorWarnings = {};
let currentSelectorIndex = 0;

// Подключение к background script
function connectPort() {
  try {
    port = chrome.runtime.connect({ name: 'mexc' });
    
    port.onDisconnect.addListener(() => {
      console.warn('[MEXC CS] Port disconnected');
      port = null;
      // Ретрай подключения
      setTimeout(connectPort, 1000);
    });

    // Отправляем HELLO сообщение
    port.postMessage({ type: 'HELLO' });
    console.info('[MEXC CS] Connected to background script');
    
  } catch (error) {
    console.error('[MEXC CS] Failed to connect:', error);
    setTimeout(connectPort, 2000);
  }
}

// Функция для локализации чисел
function localizeNumber(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\s/g, '').replace(/,/g, '.');
}

// Парсинг ордербука с fallback селекторами
function parseOrderBook() {
  const selector = ORDERBOOK_SELECTORS[currentSelectorIndex];
  const rows = document.querySelectorAll(selector);
  
  if (rows.length === 0) {
    // Если селектор не работает, попробуем следующий
    selectorWarnings[selector] = (selectorWarnings[selector] || 0) + 1;
    
    if (selectorWarnings[selector] >= 5) {
      console.warn(`[MEXC CS] Selector "${selector}" failed 5 times, trying next`);
      currentSelectorIndex = (currentSelectorIndex + 1) % ORDERBOOK_SELECTORS.length;
      selectorWarnings = {};
    }
    return null;
  }

  const asks = [];
  const bids = [];
  
  rows.forEach(row => {
    try {
      const priceCell = row.querySelector('.price, [class*="price"], td:nth-child(1), td:nth-child(2)');
      const amountCell = row.querySelector('.amount, [class*="amount"], td:nth-child(2), td:nth-child(3)');
      
      if (priceCell && amountCell) {
        const price = localizeNumber(priceCell.textContent?.trim() || '');
        const amount = localizeNumber(amountCell.textContent?.trim() || '');
        
        if (price && amount && !isNaN(parseFloat(price)) && !isNaN(parseFloat(amount))) {
          const isAsk = row.matches('.ask-row, .sell-row, [class*="ask"], [class*="sell"]') ||
                       row.querySelector('.price-down, [class*="red"]') ||
                       priceCell.classList.contains('price-down') ||
                       priceCell.classList.contains('red');
          
          const order = { price: parseFloat(price), amount: parseFloat(amount) };
          
          if (isAsk) {
            asks.push(order);
          } else {
            bids.push(order);
          }
        }
      }
    } catch (error) {
      console.warn('[MEXC CS] Error parsing row:', error);
    }
  });
  
  return { asks: asks.slice(0, 10), bids: bids.slice(0, 10) };
}

// Отправка данных ордербука
function sendOrderBookData() {
  if (!port) return;
  
  const orderBook = parseOrderBook();
  if (!orderBook || (orderBook.asks.length === 0 && orderBook.bids.length === 0)) {
    return;
  }
  
  const symbol = window.location.pathname.split('/').pop() || 'UNKNOWN';
  const data = {
    type: 'MEXC_ORDERBOOK_DATA',
    payload: {
      symbol: symbol.toUpperCase(),
      asks: orderBook.asks,
      bids: orderBook.bids,
      timestamp: Date.now(),
      url: window.location.href
    }
  };
  
  try {
    port.postMessage(data);
    messageCount++;
    lastOrderBookTime = Date.now();
    
    // Сохраняем в localStorage для терминала
    localStorage.setItem('mexc_orderbook_data', JSON.stringify(data.payload));
    
  } catch (error) {
    console.error('[MEXC CS] Failed to send orderbook data:', error);
  }
}

// Heartbeat
function sendHeartbeat() {
  if (!port) return;
  
  try {
    port.postMessage({ 
      type: 'MEXC_HEARTBEAT',
      payload: {
        timestamp: Date.now(),
        url: window.location.href,
        messageCount
      }
    });
  } catch (error) {
    console.error('[MEXC CS] Failed to send heartbeat:', error);
  }
}

// Обработка сообщений от background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.info('[MEXC CS] Received message:', message);
  
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
          lastOrderBookTime,
          currentSelector: ORDERBOOK_SELECTORS[currentSelectorIndex],
          selectorWarnings,
          portConnected: !!port
        }
      };
      sendResponse(debugInfo);
      break;
  }
  
  return true;
});

// Инициализация
connectPort();

// Парсинг ордербука каждые 100мс
setInterval(sendOrderBookData, 100);

// Heartbeat каждые 2 секунды
setInterval(sendHeartbeat, 2000);

console.info('[MEXC CS] Content script initialized');
