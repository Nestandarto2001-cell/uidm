import React, { useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useOrderBook } from "./hooks/useOrderBook";
import { MarketSummary } from "./components/MarketSummary";
import { OrderBook } from "./components/OrderBook";
import { OrderForm } from './components/OrderForm';
import { MyOrders } from './components/MyOrders';
import { UserProfiles } from './components/UserProfiles';
import { BrowserConnection } from './components/BrowserConnectionNew';
import { TickerAutocomplete } from './components/TickerAutocomplete';
import { Order } from './types';
import { CONFIG, setApiCredentials, hasApiCredentials } from './config';

interface UserProfile {
  id: string;
  name: string;
  uid: string;
  apiKey: string;
  apiSecret: string;
  rememberData: boolean;
  isActive: boolean;
}

function App() {
  const [symbol, setSymbol] = useState<string>('BTC_USDT');
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean>(hasApiCredentials());
  const [browserConnected, setBrowserConnected] = useState<boolean>(false);
  const [browserOrderBook, setBrowserOrderBook] = useState<any>(null);
  
  const { isConnected, orderBook, error, sendMessage } = useWebSocket(CONFIG.mexcWsUrl, symbol);
  const { orderBook: processedOrderBook, marketSummary, maxVolume } = useOrderBook(browserOrderBook || orderBook);
  const [orders, setOrders] = useState<Order[]>([]);
  const [balance] = useState(1000); // Mock balance

  const handlePriceClick = (price: number) => {
    // This will be passed to OrderForm component
    console.log('Price clicked:', price);
  };

  const handleOrder = (side: 'buy' | 'sell', type: 'limit' | 'market', price: number, amount: number) => {
    if (!isApiConfigured) {
      alert('Please configure API credentials first');
      return;
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      symbol,
      side,
      type,
      price,
      amount,
      status: 'pending',
      timestamp: Date.now(),
    };

    setOrders(prev => [newOrder, ...prev]);

    // Send order to MEXC API via WebSocket
    sendMessage({
      type: 'order',
      payload: {
        kind: type,
        side,
        price,
        amount,
        symbol: symbol.replace('USDT', '')
      }
    });

    console.log('Order placed:', newOrder);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'cancelled' as const } : order
    ));
    
    // Send cancel order to MEXC API
    sendMessage({
      type: 'cancelOrder',
      payload: { orderId }
    });
    
    console.log('Order cancelled:', orderId);
  };

  const handleApiCredentials = (key: string, secret: string) => {
    setApiCredentials(key, secret);
    setIsApiConfigured(true);
    console.log('API credentials configured');
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    console.log('Symbol changed to:', newSymbol);
  };

  const handleBrowserConnection = (connected: boolean) => {
    setBrowserConnected(connected);
  };

  const handleBrowserOrderBook = (data: any) => {
    setBrowserOrderBook(data);
  };

  const handleProfileSelect = (profile: UserProfile | null) => {
    setCurrentProfile(profile);
    if (profile) {
      // Обновляем конфигурацию API из профиля
      if (profile.apiKey && profile.apiSecret) {
        handleApiCredentials(profile.apiKey, profile.apiSecret);
      }
    }
  };

  // Слушаем сообщения от расширения браузера
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'MEXC_ORDERBOOK_DATA') {
        setBrowserOrderBook(event.data.payload);
        setBrowserConnected(true);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Проверяем localStorage для данных
    const checkLocalStorage = () => {
      const data = localStorage.getItem('mexc_orderbook_data');
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          setBrowserOrderBook(parsedData);
          setBrowserConnected(true);
        } catch (e) {
          console.error('Ошибка парсинга данных из localStorage:', e);
        }
      }
    };

    checkLocalStorage();
    const interval = setInterval(checkLocalStorage, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  // Mock order updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prev => prev.map(order => {
        if (order.status === 'pending' && Math.random() > 0.8) {
          return { ...order, status: 'filled' as const };
        }
        return order;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">MEXC Trading Terminal</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">Тикер:</label>
                <TickerAutocomplete
                  value={symbol}
                  onChange={setSymbol}
                  placeholder="Введите тикер (например: BTC_USDT)"
                  className="w-48"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">Быстрый выбор:</label>
                <select
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSymbolChange(e.target.value)}
                  className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
                >
                  <option value="">Выберите тикер</option>
                  <option value="BTC_USDT">BTC/USDT</option>
                  <option value="ETH_USDT">ETH/USDT</option>
                  <option value="ADA_USDT">ADA/USDT</option>
                  <option value="SOL_USDT">SOL/USDT</option>
                  <option value="DOT_USDT">DOT/USDT</option>
                  <option value="MATIC_USDT">MATIC/USDT</option>
                  <option value="AVAX_USDT">AVAX/USDT</option>
                  <option value="LINK_USDT">LINK/USDT</option>
                  <option value="DEGENFI_USDT">DEGENFI/USDT</option>
                </select>
              </div>
              <div
                className={`px-3 py-1 rounded text-sm ${
                  isApiConfigured ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {isApiConfigured ? 'API Connected' : 'API Not Configured'}
              </div>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-400 mt-2">
              Error: {error}
            </div>
          )}
        </div>

        {/* User Profiles */}
        <UserProfiles
          onProfileSelect={handleProfileSelect}
          onApiCredentials={handleApiCredentials}
        />

        {/* Browser Connection */}
        <BrowserConnection
          onConnectionStatus={handleBrowserConnection}
          onOrderBookData={handleBrowserOrderBook}
          currentTicker={symbol}
        />

        {/* API Settings */}
        {!isApiConfigured && (
          <div className="mb-6">
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const form = e.target as typeof e.target & {
                  apiKey: { value: string };
                  apiSecret: { value: string };
                };
                handleApiCredentials(form.apiKey.value, form.apiSecret.value);
              }}
              className="bg-gray-800 p-4 rounded shadow max-w-md mx-auto"
            >
              <h2 className="text-lg font-semibold text-white mb-2">API Settings</h2>
              <div className="mb-2">
                <label className="block text-gray-300 mb-1" htmlFor="apiKey">
                  API Key
                </label>
                <input
                  id="apiKey"
                  name="apiKey"
                  type="text"
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1" htmlFor="apiSecret">
                  API Secret
                </label>
                <input
                  id="apiSecret"
                  name="apiSecret"
                  type="password"
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Save API Credentials
              </button>
            </form>
          </div>
        )}

        {/* Market Summary */}
        <MarketSummary
          summary={marketSummary}
          isConnected={browserConnected || isConnected}
          symbol={symbol}
          browserConnected={browserConnected}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Book */}
          <div className="lg:col-span-2">
            <OrderBook
              orderBook={processedOrderBook}
              maxVolume={maxVolume}
              onPriceClick={handlePriceClick}
            />
          </div>

          {/* Order Form */}
          <div>
            <OrderForm
              onOrder={handleOrder}
              bestBid={marketSummary?.bestBid || 0}
              bestAsk={marketSummary?.bestAsk || 0}
              balance={balance}
              isApiConfigured={isApiConfigured}
            />
          </div>
        </div>

        {/* My Orders */}
        <div className="mt-6">
          <MyOrders orders={orders} onCancelOrder={handleCancelOrder} />
        </div>

        {/* Connection Status */}
        <div className="mt-6 text-center">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-white' : 'bg-white animate-pulse'
              }`}
            />
            {isConnected
              ? `Connected to ${symbol} WebSocket`
              : 'Disconnected from WebSocket'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
