// MEXC API Integration
export interface MexcBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface MexcOrderBook {
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
}

export class MexcApiService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string = 'https://api.mexc.com';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  // Получение баланса аккаунта
  async getAccountBalance(): Promise<MexcBalance[]> {
    try {
      // В реальном приложении здесь был бы запрос к MEXC API
      // Пока возвращаем моковые данные
      await new Promise(resolve => setTimeout(resolve, 500)); // Имитация задержки API
      
      return [
        {
          asset: 'USDT',
          free: '1000.00',
          locked: '0.00'
        },
        {
          asset: 'BTC',
          free: '0.05',
          locked: '0.00'
        },
        {
          asset: 'ETH',
          free: '2.5',
          locked: '0.0'
        }
      ];
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error('Не удалось получить баланс аккаунта');
    }
  }

  // Получение ордербука
  async getOrderBook(symbol: string): Promise<MexcOrderBook> {
    try {
      // В реальном приложении здесь был бы запрос к MEXC API
      // Пока возвращаем моковые данные с реалистичными ценами
      await new Promise(resolve => setTimeout(resolve, 100)); // Имитация задержки API
      
      const basePrice = this.getBasePrice(symbol);
      const spread = basePrice * 0.001; // 0.1% спред
      
      const bids: [string, string][] = [];
      const asks: [string, string][] = [];
      
      // Генерируем реалистичные данные ордербука
      for (let i = 0; i < 20; i++) {
        const bidPrice = basePrice - (spread / 2) - (i * basePrice * 0.0001);
        const askPrice = basePrice + (spread / 2) + (i * basePrice * 0.0001);
        const amount = Math.random() * 10 + 0.1; // Случайное количество
        
        bids.push([bidPrice.toFixed(8), amount.toFixed(6)]);
        asks.push([askPrice.toFixed(8), amount.toFixed(6)]);
      }
      
      return {
        bids: bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])), // Сортировка по убыванию
        asks: asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])), // Сортировка по возрастанию
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching order book:', error);
      throw new Error('Не удалось получить данные ордербука');
    }
  }

  // Получение базовой цены для символа
  private getBasePrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      'BTC_USDT': 50000,
      'ETH_USDT': 3000,
      'ADA_USDT': 0.5,
      'SOL_USDT': 100,
      'DOT_USDT': 7,
      'MATIC_USDT': 1,
      'AVAX_USDT': 25,
      'LINK_USDT': 15,
      'DEGENFI_USDT': 0.001
    };
    
    return prices[symbol] || 1;
  }

  // Размещение ордера
  async placeOrder(symbol: string, side: 'buy' | 'sell', type: 'limit' | 'market', price?: number, amount?: number): Promise<any> {
    try {
      // В реальном приложении здесь был бы запрос к MEXC API для размещения ордера
      await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация задержки API
      
      const orderId = Date.now().toString();
      
      return {
        orderId,
        symbol,
        side,
        type,
        price: price || 0,
        amount: amount || 0,
        status: 'pending',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error placing order:', error);
      throw new Error('Не удалось разместить ордер');
    }
  }

  // Отмена ордера
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      // В реальном приложении здесь был бы запрос к MEXC API для отмены ордера
      await new Promise(resolve => setTimeout(resolve, 500)); // Имитация задержки API
      
      return true;
    } catch (error) {
      console.error('Error canceling order:', error);
      throw new Error('Не удалось отменить ордер');
    }
  }

  // Получение активных ордеров
  async getActiveOrders(symbol?: string): Promise<any[]> {
    try {
      // В реальном приложении здесь был бы запрос к MEXC API
      await new Promise(resolve => setTimeout(resolve, 300)); // Имитация задержки API
      
      // Возвращаем пустой массив для демонстрации
      return [];
    } catch (error) {
      console.error('Error fetching active orders:', error);
      throw new Error('Не удалось получить активные ордера');
    }
  }
}

// Создаем глобальный экземпляр сервиса
let mexcApiService: MexcApiService | null = null;

export const getMexcApiService = (): MexcApiService | null => {
  return mexcApiService;
};

export const setMexcApiService = (apiKey: string, apiSecret: string): MexcApiService => {
  mexcApiService = new MexcApiService(apiKey, apiSecret);
  return mexcApiService;
};

export const clearMexcApiService = (): void => {
  mexcApiService = null;
};
