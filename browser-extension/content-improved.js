// Улучшенный Content script для MEXC
console.log('MEXC Terminal Connector (улучшенная версия) загружен');

// Функция извлечения данных ордербука с множественными селекторами
function extractOrderBookData() {
  const orderBookData = {
    bids: [],
    asks: [],
    timestamp: Date.now(),
    url: window.location.href,
    symbol: extractSymbolFromUrl()
  };

  try {
    // Расширенный список селекторов для ордербука
    const orderBookSelectors = [
      // Основные селекторы MEXC
      '[data-testid="orderbook"]',
      '.orderbook-container',
      '.orderbook',
      '[class*="orderbook"]',
      '[class*="order-book"]',
      '.depth-container',
      '.market-depth',
      '[class*="depth"]',
      
      // Альтернативные селекторы
      '.trading-panel',
      '.trading-view',
      '.market-data',
      '[class*="trading"]',
      '[class*="market"]'
    ];

    let orderBookElement = null;
    for (const selector of orderBookSelectors) {
      orderBookElement = document.querySelector(selector);
      if (orderBookElement && orderBookElement.children.length > 0) {
        console.log(`Найден ордербук с селектором: ${selector}`);
        break;
      }
    }

    // Если не нашли контейнер, ищем по содержимому
    if (!orderBookElement) {
      // Ищем элементы с ценами и количествами
      const priceElements = document.querySelectorAll('[class*="price"], [data-testid*="price"]');
      const amountElements = document.querySelectorAll('[class*="amount"], [class*="quantity"], [data-testid*="amount"]');
      
      if (priceElements.length > 2 && amountElements.length > 2) {
        orderBookElement = document.body;
        console.log('Используем document.body для поиска ордербука');
      }
    }

    if (orderBookElement) {
      // Извлекаем данные покупки (Bids)
      extractBids(orderBookElement, orderBookData);
      
      // Извлекаем данные продажи (Asks)
      extractAsks(orderBookElement, orderBookData);
    }

    // Логируем результат
    if (orderBookData.bids.length > 0 || orderBookData.asks.length > 0) {
      console.log(`Извлечено: ${orderBookData.bids.length} bids, ${orderBookData.asks.length} asks`);
    }

  } catch (error) {
    console.error('Ошибка при извлечении ордербука:', error);
  }

  return orderBookData;
}

// Извлечение символа из URL
function extractSymbolFromUrl() {
  const url = window.location.href;
  const match = url.match(/\/exchange\/([^\/\?]+)/);
  return match ? match[1] : 'UNKNOWN';
}

// Извлечение данных покупки (Bids)
function extractBids(container, orderBookData) {
  const bidSelectors = [
    // Основные селекторы
    '[class*="buy"] [class*="price"]',
    '[class*="bid"] [class*="price"]',
    '[class*="buy-price"]',
    '[class*="bid-price"]',
    '[data-testid*="buy"] [data-testid*="price"]',
    '[data-testid*="bid"] [data-testid*="price"]',
    
    // Альтернативные селекторы
    '.orderbook-bids .price',
    '.buy-orders .price',
    '.bid-list .price',
    '[class*="orderbook"][class*="bid"] .price',
    
    // Универсальные селекторы
    '[class*="price"]:not([class*="ask"]):not([class*="sell"])',
    'td:first-child', // Таблицы
    '.row .cell:first-child' // Сетки
  ];

  const amountSelectors = [
    '[class*="buy"] [class*="amount"]',
    '[class*="buy"] [class*="quantity"]',
    '[class*="bid"] [class*="amount"]',
    '[class*="bid"] [class*="quantity"]',
    '[class*="buy-amount"]',
    '[class*="buy-quantity"]',
    '[class*="bid-amount"]',
    '[class*="bid-quantity"]',
    '[data-testid*="buy"] [data-testid*="amount"]',
    '[data-testid*="bid"] [data-testid*="amount"]',
    
    '.orderbook-bids .amount',
    '.buy-orders .amount',
    '.bid-list .amount',
    'td:nth-child(2)', // Таблицы
    '.row .cell:nth-child(2)' // Сетки
  ];

  extractOrderData(container, orderBookData.bids, bidSelectors, amountSelectors, 'bid');
}

// Извлечение данных продажи (Asks)
function extractAsks(container, orderBookData) {
  const askSelectors = [
    '[class*="sell"] [class*="price"]',
    '[class*="ask"] [class*="price"]',
    '[class*="sell-price"]',
    '[class*="ask-price"]',
    '[data-testid*="sell"] [data-testid*="price"]',
    '[data-testid*="ask"] [data-testid*="price"]',
    
    '.orderbook-asks .price',
    '.sell-orders .price',
    '.ask-list .price',
    '[class*="orderbook"][class*="ask"] .price',
    '[class*="orderbook"][class*="sell"] .price'
  ];

  const amountSelectors = [
    '[class*="sell"] [class*="amount"]',
    '[class*="sell"] [class*="quantity"]',
    '[class*="ask"] [class*="amount"]',
    '[class*="ask"] [class*="quantity"]',
    '[class*="sell-amount"]',
    '[class*="sell-quantity"]',
    '[class*="ask-amount"]',
    '[class*="ask-quantity"]',
    '[data-testid*="sell"] [data-testid*="amount"]',
    '[data-testid*="ask"] [data-testid*="amount"]',
    
    '.orderbook-asks .amount',
    '.sell-orders .amount',
    '.ask-list .amount'
  ];

  extractOrderData(container, orderBookData.asks, askSelectors, amountSelectors, 'ask');
}

// Универсальная функция извлечения данных ордеров
function extractOrderData(container, orderArray, priceSelectors, amountSelectors, type) {
  try {
    // Сначала пробуем найти родительские элементы с ордерами
    const orderSelectors = [
      `[class*="${type}"]`,
      `[class*="${type === 'bid' ? 'buy' : 'sell'}"]`,
      `[data-testid*="${type}"]`,
      `[data-testid*="${type === 'bid' ? 'buy' : 'sell'}"]`,
      '.orderbook-row',
      '.order-item',
      'tr', // Таблицы
      '.row' // Сетки
    ];

    let orderElements = [];
    
    for (const selector of orderSelectors) {
      orderElements = container.querySelectorAll(selector);
      if (orderElements.length > 0) {
        console.log(`Найдено ${orderElements.length} элементов ордеров с селектором: ${selector}`);
        break;
      }
    }

    // Если не нашли родительские элементы, ищем напрямую
    if (orderElements.length === 0) {
      orderElements = [container];
    }

    // Извлекаем данные из каждого элемента
    orderElements.forEach((element, index) => {
      if (index > 20) return; // Ограничиваем количество

      let priceElement = null;
      let amountElement = null;

      // Ищем элемент цены
      for (const selector of priceSelectors) {
        priceElement = element.querySelector(selector);
        if (priceElement) break;
      }

      // Если не нашли в элементе, ищем в соседних элементах
      if (!priceElement) {
        const parent = element.parentElement;
        if (parent) {
          for (const selector of priceSelectors) {
            priceElement = parent.querySelector(selector);
            if (priceElement) break;
          }
        }
      }

      // Ищем элемент количества
      for (const selector of amountSelectors) {
        amountElement = element.querySelector(selector);
        if (amountElement) break;
      }

      // Если не нашли в элементе, ищем в соседних элементах
      if (!amountElement) {
        const parent = element.parentElement;
        if (parent) {
          for (const selector of amountSelectors) {
            amountElement = parent.querySelector(selector);
            if (amountElement) break;
          }
        }
      }

      // Извлекаем числовые значения
      if (priceElement && amountElement) {
        const priceText = priceElement.textContent || priceElement.innerText || '';
        const amountText = amountElement.textContent || amountElement.innerText || '';
        
        // Очищаем от лишних символов и конвертируем в числа
        const price = parseFloat(priceText.replace(/[^\d.-]/g, '').replace(',', '.'));
        const amount = parseFloat(amountText.replace(/[^\d.-]/g, '').replace(',', '.'));
        
        if (price > 0 && amount > 0 && !isNaN(price) && !isNaN(amount)) {
          orderArray.push([price, amount]);
        }
      }
    });

  } catch (error) {
    console.error(`Ошибка при извлечении ${type} данных:`, error);
  }
}

// Отправка данных в терминал
function sendDataToTerminal() {
  const orderBookData = extractOrderBookData();
  
  if (orderBookData.bids.length > 0 || orderBookData.asks.length > 0) {
    // Отправляем через postMessage
    window.postMessage({ 
      type: 'MEXC_ORDERBOOK_DATA', 
      payload: orderBookData 
    }, '*');
    
    // Сохраняем в localStorage как резервный вариант
    localStorage.setItem('mexc_orderbook_data', JSON.stringify(orderBookData));
    
    console.log(`Данные отправлены: ${orderBookData.bids.length} bids, ${orderBookData.asks.length} asks`);
  } else {
    console.log('Нет данных ордербука для отправки');
  }
}

// Слушаем сообщения от расширения
window.addEventListener('message', (event) => {
  if (event.data.type === 'EXTRACT_ORDERBOOK') {
    sendDataToTerminal();
  }
});

// Периодическая отправка данных
const interval = setInterval(sendDataToTerminal, 1000);

// Отправка при загрузке страницы
setTimeout(sendDataToTerminal, 2000);

// Очистка при выгрузке страницы
window.addEventListener('beforeunload', () => {
  clearInterval(interval);
});

console.log('MEXC Terminal Connector готов к работе');
