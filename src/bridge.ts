/**
 * Bridge Utility for React ↔ Extension Communication
 * Мост между React приложением и расширением браузера
 */

type AnyMsg = { type: string; [k: string]: any };
const BRIDGE_TAG = '__mexc_bridge__';

type Listener = (m: AnyMsg) => void;
const listeners = new Set<Listener>();

let isBridgeReady = false;

/**
 * Отправить сообщение в расширение
 */
export function bridgeSend(msg: AnyMsg): void {
  console.log('[Bridge] Sending message:', msg);
  window.postMessage({
    __tag: BRIDGE_TAG,
    direction: 'page->ext',
    payload: msg
  }, '*');
}

/**
 * Подписаться на сообщения от расширения
 */
export function bridgeOn(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Проверить, готов ли мост
 */
export function isBridgeAvailable(): boolean {
  return isBridgeReady;
}

/**
 * Дождаться готовности моста
 */
export function waitForBridge(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isBridgeReady) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('Bridge timeout'));
    }, timeoutMs);

    const unsubscribe = bridgeOn((msg) => {
      if (msg.type === 'BRIDGE_READY') {
        clearTimeout(timeout);
        unsubscribe();
        resolve();
      }
    });
  });
}

// Обработчик сообщений от расширения
window.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.__tag !== BRIDGE_TAG || d.direction !== 'ext->page') {
    return;
  }

  const payload = d.payload;
  
  // Обработка готовности моста
  if (payload.type === 'BRIDGE_READY') {
    isBridgeReady = true;
    console.log('[Bridge] Ready');
  }

  // Уведомляем всех слушателей
  listeners.forEach(fn => {
    try {
      fn(payload);
    } catch (error) {
      console.error('[Bridge] Error in listener:', error);
    }
  });
});

/**
 * Хелпер для запрос/ответ паттерна
 */
export function request<T = any>(
  msg: AnyMsg, 
  waitType?: string, 
  timeoutMs = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const unsubscribe = bridgeOn((resp) => {
      if (resolved) return;

      // Если указан тип ожидаемого ответа, проверяем его
      if (waitType && resp.type !== waitType) {
        return;
      }

      // Если тип не указан, принимаем любой ответ
      if (!waitType || resp.type === waitType) {
        resolved = true;
        clearTimeout(timeout);
        unsubscribe();
        resolve(resp as T);
      }
    });

    // Таймаут
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        reject(new Error('Bridge request timeout'));
      }
    }, timeoutMs);

    // Обработка ошибок
    const errorUnsubscribe = bridgeOn((resp) => {
      if (resp.type === 'ERROR' && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        unsubscribe();
        errorUnsubscribe();
        reject(new Error(resp.message || 'Unknown error'));
      }
    });

    // Отправляем запрос
    bridgeSend(msg);
  });
}

/**
 * Специфичные методы для Assessment Zone
 */
export const AssessmentBridge = {
  /**
   * Запустить мониторинг
   */
  async start(): Promise<void> {
    await waitForBridge();
    bridgeSend({ type: 'ASSESS_START' });
  },

  /**
   * Остановить мониторинг
   */
  async stop(): Promise<void> {
    await waitForBridge();
    bridgeSend({ type: 'ASSESS_STOP' });
  },

  /**
   * Принудительное обновление
   */
  async refresh(): Promise<void> {
    await waitForBridge();
    return request({ type: 'ASSESS_REFRESH' }, 'ASSESS_REFRESH_DONE', 10000);
  },

  /**
   * Получить статус
   */
  async getStatus(): Promise<any> {
    await waitForBridge();
    return request({ type: 'ASSESS_STATUS_REQUEST' }, 'ASSESS_STATUS', 5000);
  },

  /**
   * Подписаться на обновления данных
   */
  onUpdate(callback: (data: any) => void): () => void {
    return bridgeOn((msg) => {
      if (msg.type === 'ASSESS_UPDATE') {
        callback(msg.payload);
      }
    });
  },

  /**
   * Подписаться на изменения статуса
   */
  onStatusChange(callback: (status: any) => void): () => void {
    return bridgeOn((msg) => {
      if (msg.type === 'ASSESS_STATUS') {
        callback(msg.payload);
      }
    });
  },

  /**
   * Подписаться на ошибки
   */
  onError(callback: (error: string) => void): () => void {
    return bridgeOn((msg) => {
      if (msg.type === 'ERROR') {
        callback(msg.message || 'Unknown error');
      }
    });
  }
};

export default AssessmentBridge;
