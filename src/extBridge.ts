/**
 * Extension Bridge - Мост между страницей и расширением
 */

type Msg = { id?: string; source: 'MEXC_TT'; type: string; [k: string]: any };

let ready = false;
const waiters = new Map<string, (v: any) => void>();

// Обработка сообщений от content script
window.addEventListener('message', (e) => {
  const m = e.data;
  if (!m || m.source !== 'MEXC_TT') return;
  
  console.log('[ExtBridge] Received message:', m);
  
  if (m.type === 'EXT_READY') { 
    ready = true; 
    console.log('[ExtBridge] Extension ready');
  }
  if (m.type === 'PONG') { 
    console.log('[ExtBridge] Pong received');
  }
  if (m.id && waiters.has(m.id)) { 
    const waiter = waiters.get(m.id)!;
    waiter(m); 
    waiters.delete(m.id); 
  }
});

export function extIsReady(): boolean { 
  // Проверяем несколько способов определения готовности расширения
  const hasContentScript = document.querySelector('script[src*="content.js"]') !== null;
  const hasExtensionAPI = typeof window !== 'undefined' && 
    typeof (window as any).chrome !== 'undefined' && 
    (window as any).chrome.runtime;
  
  console.log('[ExtBridge] Extension status check:', {
    ready,
    hasContentScript,
    hasExtensionAPI,
    userAgent: navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge')
  });
  
  return ready || hasExtensionAPI;
}

function ask(type: string, payload: any = {}) {
  const id = Math.random().toString(36).slice(2);
  const msg: Msg = { source: 'MEXC_TT', type, id, ...payload };
  
  console.log('[ExtBridge] Sending message:', msg);
  
  return new Promise((res) => {
    waiters.set(id, res);
    window.postMessage(msg, window.origin);
    setTimeout(() => {
      if (waiters.has(id)) {
        waiters.delete(id);
        res({ type: 'ERR', error: 'timeout' });
      }
    }, 5000);
  });
}

// API функции
export async function probe() {
  return ask('PROBE');
}

export async function fetchBook(symbol: string) {
  return ask('FETCH_BOOK', { symbol });
}

export async function fetchTicker(symbol: string) {
  return ask('FETCH_TICKER', { symbol });
}

export async function fetch24hrTicker(symbol: string) {
  return ask('FETCH_24HR_TICKER', { symbol });
}

// Assessment Zone функции
export async function startAssessment() {
  return ask('ASSESS_START');
}

export async function stopAssessment() {
  return ask('ASSESS_STOP');
}

export async function refreshAssessment() {
  return ask('ASSESS_REFRESH');
}

export async function getAssessmentStatus() {
  return ask('ASSESS_STATUS_REQUEST');
}

// Ping функция для проверки связи
export async function ping(): Promise<boolean> {
  try {
    console.log('[ExtBridge] Sending ping...');
    const response = await ask('PING');
    console.log('[ExtBridge] Ping response:', response);
    
    if (response && typeof response === 'object' && (response as any).type === 'PONG') {
      return true;
    }
    
    // Fallback: если нет PONG, но есть ответ от расширения
    if (response && typeof response === 'object') {
      console.log('[ExtBridge] Got response but not PONG, considering as connected');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[ExtBridge] Ping failed:', error);
    return false;
  }
}
