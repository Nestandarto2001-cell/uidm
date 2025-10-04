console.info('[SW] Service Worker started');

// Import announcements watcher
importScripts('announcementsWatcher.js');

// Terminal bridge ports
const terminalPorts = new Set();

// Функции для публикации сообщений
function publishToTerminal(msg) {
  // Отправляем в старый порт
  if (state.terminalPort) {
    try {
      state.terminalPort.postMessage(msg);
    } catch (error) {
      log('Failed to send to old terminal port: ' + error.message, 'error');
    }
  }
  
  // Отправляем в bridge порты
  terminalPorts.forEach(port => {
    try {
      port.postMessage(msg);
    } catch (error) {
      log('Failed to send to bridge port: ' + error.message, 'error');
      terminalPorts.delete(port);
    }
  });
}

function publishAssessmentUpdate(payload) {
  publishToTerminal({ type: 'ASSESS_UPDATE', payload });
}

function publishAssessmentStatus(status) {
  publishToTerminal({ type: 'ASSESS_STATUS', payload: status });
}

// Assessment Watcher Control Functions
async function startAssessmentWatcher() {
  try {
    // Start the assessment watcher alarm
    await chrome.alarms.create('assessmentCheck', {
      delayInMinutes: 1,
      periodInMinutes: 10
    });
    log('Assessment watcher started');
    return { success: true, message: 'Assessment watcher started' };
  } catch (error) {
    log('Failed to start assessment watcher: ' + error.message, 'error');
    throw error;
  }
}

async function stopAssessmentWatcher() {
  try {
    await chrome.alarms.clear('assessmentCheck');
    log('Assessment watcher stopped');
    return { success: true, message: 'Assessment watcher stopped' };
  } catch (error) {
    log('Failed to stop assessment watcher: ' + error.message, 'error');
    throw error;
  }
}

async function performAssessmentCheck() {
  try {
    // Create a one-time alarm to trigger assessment check
    await chrome.alarms.create('assessmentCheckNow', {
      delayInMinutes: 0
    });
    log('Assessment check triggered');
    return { success: true, message: 'Assessment check completed' };
  } catch (error) {
    log('Failed to perform assessment check: ' + error.message, 'error');
    throw error;
  }
}

async function getAssessmentWatcherStatus() {
  try {
    const alarms = await chrome.alarms.getAll();
    const assessmentAlarm = alarms.find(alarm => alarm.name === 'assessmentCheck');
    
    return {
      isRunning: !!assessmentAlarm,
      lastCheckTime: new Date().toISOString(),
      checkInterval: 10
    };
  } catch (error) {
    log('Failed to get assessment watcher status: ' + error.message, 'error');
    return {
      isRunning: false,
      lastError: error.message
    };
  }
}

// Состояние расширения
const state = {
  mexcPort: null,
  terminalPort: null,
  lastHeartbeat: null,
  lastOrderBook: null,
  messageCount: { incoming: 0, outgoing: 0 },
  errors: [],
  retryAttempts: { mexc: 0, terminal: 0 },
  maxRetries: 5
};

// Retry backoff delays (ms)
const RETRY_DELAYS = [500, 1000, 2000, 5000, 10000];

// Логирование
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [SW] ${message}`;
  
  switch (level) {
    case 'error':
      console.error(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    default:
      console.info(logMessage);
  }
}

// Добавление ошибки
function addError(error) {
  state.errors.push({
    message: error.message || error,
    timestamp: Date.now(),
    stack: error.stack
  });
  
  // Храним только последние 3 ошибки
  if (state.errors.length > 3) {
    state.errors.shift();
  }
}

// Получение статистики сообщений
function getMessageStats() {
  const now = Date.now();
  const windowMs = 5000; // 5 секунд
  
  // Простая реализация - в реальном приложении можно использовать более сложную логику
  const totalMessages = state.messageCount.incoming + state.messageCount.outgoing;
  const msgsPerSec = totalMessages > 0 ? (totalMessages / (windowMs / 1000)).toFixed(1) : '0.0';
  
  return {
    incoming: state.messageCount.incoming,
    outgoing: state.messageCount.outgoing,
    msgsPerSec
  };
}

// Подключение портов
chrome.runtime.onConnect.addListener((port) => {
  log(`Port connected: ${port.name}`);
  
  switch (port.name) {
    case 'mexc':
      state.mexcPort = port;
      state.retryAttempts.mexc = 0;
      log('MEXC port connected');
      break;
      
    case 'terminal':
      // Новый bridge connection
      terminalPorts.add(port);
      log('Terminal bridge connected');
      
      // Также сохраняем для обратной совместимости
      state.terminalPort = port;
      state.retryAttempts.terminal = 0;
      break;
      
    default:
      log(`Unknown port name: ${port.name}`, 'warn');
  }
  
  // Обработка отключения порта
  port.onDisconnect.addListener(() => {
    log(`Port disconnected: ${port.name}`);
    
    switch (port.name) {
      case 'mexc':
        state.mexcPort = null;
        state.lastHeartbeat = null;
        state.lastOrderBook = null;
        retryConnect('mexc');
        break;
        
      case 'terminal':
        state.terminalPort = null;
        retryConnect('terminal');
        break;
    }
  });
  
  // Обработка сообщений
  port.onMessage.addListener((message) => {
    handleMessage(port.name, message, port);
  });
});

// Retry подключения с backoff
function retryConnect(portType) {
  if (state.retryAttempts[portType] >= state.maxRetries) {
    log(`Max retry attempts reached for ${portType} port`, 'warn');
    return;
  }
  
  const delay = RETRY_DELAYS[state.retryAttempts[portType]] || 10000;
  state.retryAttempts[portType]++;
  
  log(`Retrying ${portType} connection in ${delay}ms (attempt ${state.retryAttempts[portType]})`);
  
  setTimeout(() => {
    // В реальном приложении здесь был бы код для переподключения
    // Для content scripts это происходит автоматически
    log(`Retry attempt ${state.retryAttempts[portType]} for ${portType}`);
  }, delay);
}

// Обработка сообщений
function handleMessage(portName, message, port) {
  state.messageCount.incoming++;
  
  log(`Message from ${portName}: ${message.type}`);
  
  try {
    switch (message.type) {
      case 'HELLO':
        log(`${portName} port said hello`);
        break;
        
      case 'MEXC_HEARTBEAT':
        state.lastHeartbeat = Date.now();
        log(`Heartbeat from MEXC: ${new Date(state.lastHeartbeat).toLocaleTimeString()}`);
        break;
        
      case 'MEXC_ORDERBOOK_DATA':
        state.lastOrderBook = Date.now();
        state.messageCount.outgoing++;
        
        // Пересылаем данные в терминал
        if (state.terminalPort) {
          state.terminalPort.postMessage(message);
          log(`OrderBook data forwarded to terminal: ${message.payload.asks.length} asks, ${message.payload.bids.length} bids`);
        } else {
          log('Terminal port not connected, cannot forward orderbook data', 'warn');
        }
        break;
        
      case 'PING':
        if (port) {
          const pongMessage = { type: 'PONG', timestamp: Date.now() };
          port.postMessage(pongMessage);
          state.messageCount.outgoing++;
          log(`PONG sent to ${portName}`);
        }
        break;
        
      case 'ASSESS_START':
        startAssessmentWatcher().then(() => {
          publishAssessmentStatus({ isRunning: true, message: 'Assessment watcher started' });
        }).catch(error => {
          port.postMessage({ type: 'ERROR', message: error.message });
        });
        break;
        
      case 'ASSESS_STOP':
        stopAssessmentWatcher().then(() => {
          publishAssessmentStatus({ isRunning: false, message: 'Assessment watcher stopped' });
        }).catch(error => {
          port.postMessage({ type: 'ERROR', message: error.message });
        });
        break;
        
      case 'ASSESS_REFRESH':
        performAssessmentCheck().then(() => {
          port.postMessage({ type: 'ASSESS_REFRESH_DONE' });
        }).catch(error => {
          port.postMessage({ type: 'ERROR', message: error.message });
        });
        break;
        
      case 'ASSESS_STATUS_REQUEST':
        getAssessmentWatcherStatus().then(status => {
          port.postMessage({ type: 'ASSESS_STATUS', payload: status });
        }).catch(error => {
          port.postMessage({ type: 'ERROR', message: error.message });
        });
        break;

      case 'DEBUG_DUMP':
        const debugInfo = {
          type: 'DEBUG_DUMP_RESPONSE',
          payload: {
            timestamp: Date.now(),
            ports: {
              mexc: !!state.mexcPort,
              terminal: !!state.terminalPort
            },
            lastHeartbeat: state.lastHeartbeat,
            lastOrderBook: state.lastOrderBook,
            messageStats: getMessageStats(),
            errors: state.errors,
            retryAttempts: state.retryAttempts
          }
        };
        
        if (port) {
          port.postMessage(debugInfo);
          state.messageCount.outgoing++;
        }
        
        // Также логируем в консоль
        log('DEBUG DUMP:');
        console.table({
          'MEXC Port': state.mexcPort ? 'Connected' : 'Disconnected',
          'Terminal Port': state.terminalPort ? 'Connected' : 'Disconnected',
          'Last Heartbeat': state.lastHeartbeat ? new Date(state.lastHeartbeat).toLocaleTimeString() : 'Never',
          'Last OrderBook': state.lastOrderBook ? new Date(state.lastOrderBook).toLocaleTimeString() : 'Never',
          'Messages/sec': getMessageStats().msgsPerSec,
          'Errors': state.errors.length
        });
        break;
        
      default:
        log(`Unknown message type: ${message.type}`, 'warn');
    }
  } catch (error) {
    log(`Error handling message: ${error.message}`, 'error');
    addError(error);
  }
}

// Обработка сообщений от popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log(`Message from popup: ${message.type}`);
  
  switch (message.type) {
    case 'GET_STATUS':
      const status = {
        ports: {
          mexc: !!state.mexcPort,
          terminal: !!state.terminalPort
        },
        lastHeartbeat: state.lastHeartbeat,
        lastOrderBook: state.lastOrderBook,
        messageStats: getMessageStats(),
        errors: state.errors,
        stale: state.lastOrderBook ? (Date.now() - state.lastOrderBook) > 1500 : true
      };
      sendResponse(status);
      break;
      
    case 'PING':
      if (state.mexcPort) {
        const pingTime = Date.now();
        state.mexcPort.postMessage({ type: 'PING' });
        // Ожидаем PONG в handleMessage
        sendResponse({ type: 'PING_SENT', timestamp: pingTime });
      } else {
        sendResponse({ type: 'ERROR', message: 'MEXC port not connected' });
      }
      break;
      
    default:
      sendResponse({ type: 'ERROR', message: 'Unknown message type' });
  }
  
  return true;
});

// Периодическое логирование статистики
setInterval(() => {
  const stats = getMessageStats();
  if (stats.incoming > 0 || stats.outgoing > 0) {
    log(`Stats: ${stats.incoming} in, ${stats.outgoing} out, ${stats.msgsPerSec} msg/s`);
  }
}, 10000);

// Проверка stale состояния
setInterval(() => {
  if (state.lastOrderBook && (Date.now() - state.lastOrderBook) > 1500) {
    log('OrderBook data is stale (>1500ms)', 'warn');
  }
}, 2000);

log('Background script initialized');