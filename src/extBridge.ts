/**
 * Extension Bridge - мост между страницей и расширением
 * Обеспечивает связь с background.js для API запросов
 */

interface ExtMessage {
  source: 'MEXC_TT';
  type: string;
  payload?: any;
  id?: string;
}

interface ExtResponse {
  type: string;
  payload?: any;
  error?: string;
  id?: string;
}

class ExtensionBridge {
  private messageId = 0;
  private pendingMessages = new Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>();

  constructor() {
    // Слушаем сообщения от расширения
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent) {
    if (event.data?.source !== 'MEXC_TT') return;

    const response = event.data as ExtResponse;
    
    if (response.id && this.pendingMessages.has(response.id)) {
      const { resolve, reject } = this.pendingMessages.get(response.id)!;
      this.pendingMessages.delete(response.id);
      
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.payload);
      }
    }
  }

  private sendMessage(type: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `msg_${++this.messageId}_${Date.now()}`;
      
      this.pendingMessages.set(id, { resolve, reject });
      
      const message: ExtMessage = {
        source: 'MEXC_TT',
        type,
        payload,
        id
      };

      window.postMessage(message, '*');
      
      // Таймаут для запроса
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  // Проверка готовности расширения
  async ping(): Promise<boolean> {
    try {
      const response = await this.sendMessage('PING');
      return response === 'PONG';
    } catch (error) {
      console.error('[ExtBridge] Ping failed:', error);
      return false;
    }
  }

  // Проверка доступности MEXC API
  async probe(): Promise<any> {
    try {
      return await this.sendMessage('PROBE');
    } catch (error) {
      console.error('[ExtBridge] Probe failed:', error);
      return { type: 'PROBE_ERROR', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Получение данных ордербука
  async getOrderBook(symbol: string): Promise<any> {
    try {
      return await this.sendMessage('GET_ORDERBOOK', { symbol });
    } catch (error) {
      console.error('[ExtBridge] GetOrderBook failed:', error);
      throw error;
    }
  }

  // Получение баланса аккаунта
  async getBalance(): Promise<any> {
    try {
      return await this.sendMessage('GET_BALANCE');
    } catch (error) {
      console.error('[ExtBridge] GetBalance failed:', error);
      throw error;
    }
  }

  // Получение списка символов
  async getSymbols(): Promise<any> {
    try {
      return await this.sendMessage('GET_SYMBOLS');
    } catch (error) {
      console.error('[ExtBridge] GetSymbols failed:', error);
      throw error;
    }
  }

  // Получение тикера
  async getTicker(symbol: string): Promise<any> {
    try {
      return await this.sendMessage('GET_TICKER', { symbol });
    } catch (error) {
      console.error('[ExtBridge] GetTicker failed:', error);
      throw error;
    }
  }

  // Размещение ордера
  async placeOrder(orderData: any): Promise<any> {
    try {
      return await this.sendMessage('PLACE_ORDER', orderData);
    } catch (error) {
      console.error('[ExtBridge] PlaceOrder failed:', error);
      throw error;
    }
  }

  // Отмена ордера
  async cancelOrder(orderId: string): Promise<any> {
    try {
      return await this.sendMessage('CANCEL_ORDER', { orderId });
    } catch (error) {
      console.error('[ExtBridge] CancelOrder failed:', error);
      throw error;
    }
  }
}

// Создаем глобальный экземпляр
const extBridge = new ExtensionBridge();

// Экспортируем функции
export const ping = () => extBridge.ping();
export const probe = () => extBridge.probe();
export const getOrderBook = (symbol: string) => extBridge.getOrderBook(symbol);
export const getBalance = () => extBridge.getBalance();
export const getSymbols = () => extBridge.getSymbols();
export const getTicker = (symbol: string) => extBridge.getTicker(symbol);
export const placeOrder = (orderData: any) => extBridge.placeOrder(orderData);
export const cancelOrder = (orderId: string) => extBridge.cancelOrder(orderId);

// Проверка готовности расширения
export function extIsReady(): boolean {
  // Проверяем несколько способов определения готовности расширения
  const hasContentScript = document.querySelector('script[src*="content.js"]') !== null;
  const hasExtensionAPI = typeof window !== 'undefined' &&
    typeof (window as any).chrome !== 'undefined' &&
    (window as any).chrome.runtime;
  
  // Проверяем наличие сообщений от расширения
  const hasExtensionMessages = document.querySelector('meta[name="mexc-tt-extension"]') !== null;
  
  return hasContentScript || hasExtensionAPI || hasExtensionMessages;
}

export default extBridge;