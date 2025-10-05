/**
 * Service Worker - Background Script
 * Все сетевые запросы к MEXC идут отсюда
 */

console.log('[Service Worker] Started');

// Heartbeat для поддержания связи со страницей
let heartbeatInterval = null;
let lastHeartbeat = Date.now();

// Функция отправки heartbeat на все вкладки терминала
async function sendHeartbeat() {
  try {
    // Ищем все вкладки терминала
    const tabs = await chrome.tabs.query({ 
      url: ['http://localhost/*', 'http://127.0.0.1/*', 'http://localhost:3009/*', 'http://localhost:5173/*'] 
    });
    
    console.log('[Service Worker] Found terminal tabs:', tabs.length);
    
    if (tabs.length === 0) {
      console.log('[Service Worker] No terminal tabs found');
      return;
    }
    
    for (const tab of tabs) {
      try {
        // Проверяем что вкладка активна
        if (tab.status === 'loading') {
          console.log('[Service Worker] Tab is loading, skipping:', tab.id);
          continue;
        }
        
        await chrome.tabs.sendMessage(tab.id, {
          type: 'MEXC_HEARTBEAT',
          timestamp: Date.now(),
          tabId: tab.id
        });
        lastHeartbeat = Date.now();
        console.log('[Service Worker] Heartbeat sent to tab:', tab.id, tab.url);
      } catch (error) {
        console.log('[Service Worker] Failed to send heartbeat to tab:', tab.id, error.message);
        // Не останавливаем цикл при ошибке одной вкладки
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error sending heartbeat:', error);
  }
}

// Запускаем heartbeat каждые 5 секунд
function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  heartbeatInterval = setInterval(sendHeartbeat, 5000);
  console.log('[Service Worker] Heartbeat started');
}

// Останавливаем heartbeat
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[Service Worker] Heartbeat stopped');
  }
}

// API функции для работы с MEXC
const api = {
  async probe() {
    console.log('[Service Worker] Probing MEXC API...');
    const r = await fetch('https://api.mexc.com/api/v3/time', { 
      cache: 'no-store',
      method: 'GET'
    });
    if (!r.ok) throw new Error('MEXC time failed ' + r.status);
    const j = await r.json();
    console.log('[Service Worker] MEXC API probe successful:', j);
    return { ok: true, data: j };
  },

  async getBook(symbol) {
    console.log('[Service Worker] Fetching order book for:', symbol);
    const url = `https://api.mexc.com/api/v3/depth?symbol=${symbol}&limit=50`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('depth fail ' + r.status);
    const data = await r.json();
    console.log('[Service Worker] Order book fetched:', data);
    return data;
  },

  async getTicker(symbol) {
    console.log('[Service Worker] Fetching ticker for:', symbol);
    const url = `https://api.mexc.com/api/v3/ticker/price?symbol=${symbol}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('ticker fail ' + r.status);
    const data = await r.json();
    console.log('[Service Worker] Ticker fetched:', data);
    return data;
  },

  async get24hrTicker(symbol) {
    console.log('[Service Worker] Fetching 24hr ticker for:', symbol);
    const url = `https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('24hr ticker fail ' + r.status);
    const data = await r.json();
    console.log('[Service Worker] 24hr ticker fetched:', data);
    return data;
  }
};

// Обработка сообщений от content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[Service Worker] Received message:', msg);
  
  (async () => {
    try {
      if (msg.type === 'PROBE') {
        const res = await api.probe();
        sendResponse({ type: 'PROBE_OK', res });
      } else if (msg.type === 'FETCH_BOOK') {
        const res = await api.getBook(msg.symbol);
        sendResponse({ type: 'BOOK_OK', res });
      } else if (msg.type === 'FETCH_TICKER') {
        const res = await api.getTicker(msg.symbol);
        sendResponse({ type: 'TICKER_OK', res });
      } else if (msg.type === 'FETCH_24HR_TICKER') {
        const res = await api.get24hrTicker(msg.symbol);
        sendResponse({ type: 'TICKER_24HR_OK', res });
      } else if (msg.type === 'ASSESS_START') {
        // Start assessment monitoring
        await chrome.alarms.create('assessmentCheck', {
          delayInMinutes: 1,
          periodInMinutes: 10
        });
        sendResponse({ type: 'ASSESS_START_OK' });
      } else if (msg.type === 'ASSESS_STOP') {
        // Stop assessment monitoring
        await chrome.alarms.clear('assessmentCheck');
        sendResponse({ type: 'ASSESS_STOP_OK' });
      } else if (msg.type === 'ASSESS_REFRESH') {
        // Trigger assessment check
        await chrome.alarms.create('assessmentCheckNow', {
          delayInMinutes: 0
        });
        sendResponse({ type: 'ASSESS_REFRESH_OK' });
      } else if (msg.type === 'ASSESS_STATUS_REQUEST') {
        // Get assessment status
        const alarms = await chrome.alarms.getAll();
        const assessmentAlarm = alarms.find(alarm => alarm.name === 'assessmentCheck');
        const status = {
          isRunning: !!assessmentAlarm,
          lastCheckTime: new Date().toISOString(),
          checkInterval: 10
        };
        sendResponse({ type: 'ASSESS_STATUS_OK', status });
      } else if (msg.type === 'PING') {
        // Запускаем heartbeat при первом ping
        if (!heartbeatInterval) {
          startHeartbeat();
        }
        sendResponse({ type: 'PONG', timestamp: Date.now() });
      } else {
        sendResponse({ type: 'ERR', error: 'unknown_msg' });
      }
    } catch (e) {
      console.error('[Service Worker] Error:', e);
      sendResponse({ type: 'ERR', error: String(e) });
    }
  })();
  
  return true; // async
});

// Обработка алармов для Assessment Zone
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'assessmentCheck' || alarm.name === 'assessmentCheckNow') {
    console.log('[Service Worker] Assessment check triggered');
    // Здесь будет логика проверки Assessment Zone
    // Пока просто логируем
    console.log('[Service Worker] Assessment Zone check completed');
  }
});

// Обработка установки расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Service Worker] Extension installed');
  // Запускаем heartbeat сразу после установки
  setTimeout(startHeartbeat, 1000);
});

// Запускаем heartbeat при старте service worker
startHeartbeat();

console.log('[Service Worker] Ready');
