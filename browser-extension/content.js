// Content script для MEXC
console.log('MEXC Terminal Connector загружен');

// Функция извлечения данных ордербука
function extractOrderBookData() {
  const orderBookData = {
    bids: [],
    asks: [],
    timestamp: Date.now()
  };

  try {
    // Различные селекторы для поиска ордербука на MEXC
    const selectors = [
      '[data-testid="orderbook"]',
      '.orderbook',
      '[class*="orderbook"]',
      '[class*="order-book"]',
      '.depth-container',
      '[class*="depth"]',
      '.market-depth'
    ];

    let orderBookElement = null;
    for (const selector of selectors) {
      orderBookElement = document.querySelector(selector);
      if (orderBookElement) break;
    }

    if (!orderBookElement) {
      // Ищем по тексту "Buy" и "Sell"
      const buyElements = document.querySelectorAll('[class*="buy"], [class*="bid"]');
      const sellElements = document.querySelectorAll('[class*="sell"], [class*="ask"]');
      
      if (buyElements.length > 0 || sellElements.length > 0) {
        orderBookElement = document.body;
      }
    }

    if (orderBookElement) {
      // Извлекаем данные покупки (Bids)
      const bidSelectors = [
        '[class*="buy"] [class*="price"]',
        '[class*="bid"] [class*="price"]',
        '[class*="buy-price"]',
        '[class*="bid-price"]'
      ];

      const amountSelectors = [
        '[class*="buy"] [class*="amount"]',
        '[class*="bid"] [class*="amount"]',
        '[class*="buy-volume"]',
        '[class*="bid-volume"]'
      ];

      // Пытаемся найти данные покупки
      for (let i = 0; i < 10; i++) {
        let priceElement = null;
        let amountElement = null;

        // Ищем элементы с ценами и объемами
        const allElements = Array.from(orderBookElement.querySelectorAll('*'));
        
        for (const el of allElements) {
          const text = el.textContent || '';
          // Проверяем, что это похоже на цену (содержит точку и цифры)
          if (/^\d+\.\d+$/.test(text.trim()) && !priceElement) {
            const rect = el.getBoundingClientRect();
            // Проверяем, что элемент в левой части (обычно bids)
            if (rect.left < window.innerWidth / 2) {
              priceElement = el;
            }
          }
          // Проверяем, что это похоже на объем
          if (/^\d+(\.\d+)?$/.test(text.trim()) && text.includes('.') && !amountElement && priceElement) {
            amountElement = el;
            break;
          }
        }

        if (priceElement && amountElement) {
          const price = parseFloat(priceElement.textContent.replace(/[^0-9.-]/g, ''));
          const amount = parseFloat(amountElement.textContent.replace(/[^0-9.-]/g, ''));
          
          if (price > 0 && amount > 0) {
            orderBookData.bids.push([price, amount]);
          }
        }
      }

      // Извлекаем данные продажи (Asks)
      for (let i = 0; i < 10; i++) {
        let priceElement = null;
        let amountElement = null;

        const allElements = Array.from(orderBookElement.querySelectorAll('*'));
        
        for (const el of allElements) {
          const text = el.textContent || '';
          // Проверяем, что это похоже на цену
          if (/^\d+\.\d+$/.test(text.trim()) && !priceElement) {
            const rect = el.getBoundingClientRect();
            // Проверяем, что элемент в правой части (обычно asks)
            if (rect.left > window.innerWidth / 2) {
              priceElement = el;
            }
          }
          // Проверяем, что это похоже на объем
          if (/^\d+(\.\d+)?$/.test(text.trim()) && text.includes('.') && !amountElement && priceElement) {
            amountElement = el;
            break;
          }
        }

        if (priceElement && amountElement) {
          const price = parseFloat(priceElement.textContent.replace(/[^0-9.-]/g, ''));
          const amount = parseFloat(amountElement.textContent.replace(/[^0-9.-]/g, ''));
          
          if (price > 0 && amount > 0) {
            orderBookData.asks.push([price, amount]);
          }
        }
      }

      // Альтернативный метод - поиск по структуре таблицы
      if (orderBookData.bids.length === 0 && orderBookData.asks.length === 0) {
        const tables = document.querySelectorAll('table');
        for (const table of tables) {
          const rows = table.querySelectorAll('tr');
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const priceText = cells[0]?.textContent?.trim();
              const amountText = cells[1]?.textContent?.trim();
              
              if (priceText && amountText && /^\d+\.\d+$/.test(priceText)) {
                const price = parseFloat(priceText);
                const amount = parseFloat(amountText.replace(/[^0-9.-]/g, ''));
                
                if (price > 0 && amount > 0) {
                  // Определяем, это bid или ask по позиции
                  const rect = row.getBoundingClientRect();
                  if (rect.top < window.innerHeight / 2) {
                    orderBookData.asks.push([price, amount]);
                  } else {
                    orderBookData.bids.push([price, amount]);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Получаем информацию о текущем тикере
    const url = window.location.href;
    const tickerMatch = url.match(/\/exchange\/([A-Z]+_USDT)/);
    if (tickerMatch) {
      orderBookData.symbol = tickerMatch[1];
    }

    return orderBookData;
  } catch (error) {
    console.error('Ошибка при извлечении данных ордербука:', error);
    return orderBookData;
  }
}

// Отправка данных в терминал
function sendOrderBookData() {
  const data = extractOrderBookData();
  
  // Отправляем данные всем окнам терминала
  window.postMessage({
    type: 'MEXC_ORDERBOOK_DATA',
    payload: data
  }, '*');

  // Также отправляем в localStorage для совместимости
  localStorage.setItem('mexc_orderbook_data', JSON.stringify(data));
}

// Запускаем извлечение данных
setInterval(sendOrderBookData, 1000);

// Также слушаем изменения DOM
const observer = new MutationObserver(() => {
  setTimeout(sendOrderBookData, 100);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Уведомляем о загрузке
console.log('MEXC Terminal Connector готов к работе');

// Создаем глобальную функцию для ручного извлечения данных
window.mexcExtension = {
  extractOrderBookData,
  sendOrderBookData
};
