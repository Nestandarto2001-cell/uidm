// Простой Content script для MEXC - тестовая версия
console.log('MEXC Simple Connector загружен');

// Функция для создания тестовых данных ордербука
function createTestOrderBook() {
  const basePrice = 50000 + Math.random() * 1000; // Случайная цена около 50000
  
  const bids = [];
  const asks = [];
  
  // Создаем 5 уровней для покупки (bids)
  for (let i = 0; i < 5; i++) {
    const price = basePrice - (i * 10);
    const amount = 0.1 + Math.random() * 0.5;
    bids.push([parseFloat(price.toFixed(2)), parseFloat(amount.toFixed(4))]);
  }
  
  // Создаем 5 уровней для продажи (asks)
  for (let i = 0; i < 5; i++) {
    const price = basePrice + (i * 10);
    const amount = 0.1 + Math.random() * 0.5;
    asks.push([parseFloat(price.toFixed(2)), parseFloat(amount.toFixed(4))]);
  }
  
  return {
    bids: bids,
    asks: asks,
    timestamp: Date.now(),
    url: window.location.href,
    symbol: extractSymbolFromUrl()
  };
}

// Извлечение символа из URL
function extractSymbolFromUrl() {
  const url = window.location.href;
  const match = url.match(/\/exchange\/([^\/\?]+)/);
  return match ? match[1] : 'BTC_USDT';
}

// Отправка данных в терминал
function sendDataToTerminal() {
  const orderBookData = createTestOrderBook();
  
  console.log('Отправляем тестовые данные ордербука:', orderBookData);
  
  // Отправляем через postMessage
  window.postMessage({ 
    type: 'MEXC_ORDERBOOK_DATA', 
    payload: orderBookData 
  }, '*');
  
  // Сохраняем в localStorage как резервный вариант
  localStorage.setItem('mexc_orderbook_data', JSON.stringify(orderBookData));
  
  console.log(`Данные отправлены: ${orderBookData.bids.length} bids, ${orderBookData.asks.length} asks`);
}

// Слушаем сообщения от расширения
window.addEventListener('message', (event) => {
  if (event.data.type === 'EXTRACT_ORDERBOOK') {
    sendDataToTerminal();
  }
});

// Периодическая отправка данных каждые 2 секунды
const interval = setInterval(sendDataToTerminal, 2000);

// Отправка при загрузке страницы
setTimeout(sendDataToTerminal, 1000);

// Очистка при выгрузке страницы
window.addEventListener('beforeunload', () => {
  clearInterval(interval);
});

console.log('MEXC Simple Connector готов к работе - отправляет тестовые данные каждые 2 секунды');
