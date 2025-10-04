import React, { useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useOrderBook } from "./hooks/useOrderBook";
import { useRealOrderBook } from "./hooks/useRealOrderBook";
import { MarketSummary } from "./components/MarketSummary";
import { ProfessionalOrderBook } from "./components/ProfessionalOrderBook";
import { OrderForm } from './components/OrderForm';
import { MyOrders } from './components/MyOrders';
import { ProfilesBar } from './components/ProfilesBar';
import { FavoritesBar } from './components/FavoritesBar';
import { BrowserConnection } from './components/BrowserConnectionNew';
import { BalanceDisplay } from './components/BalanceDisplay';
import { TopActions } from './components/TopActions';
import { CollapsiblePanel } from './components/CollapsiblePanel';
import { Header } from './components/Header';
import { SymbolPickerModal } from './components/SymbolPickerModal';
import { ExtensionPanel } from './components/ExtensionPanel';
import { ProfileCreateModal } from './components/ProfileCreateModal';
import TabNavigation from './components/TabNavigation';
import AssessmentZone from './components/AssessmentZone';
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
  const [isSymbolPickerOpen, setIsSymbolPickerOpen] = useState(false);
  const [isExtensionPanelOpen, setIsExtensionPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'trading' | 'assessment'>('trading');
  
  const { isConnected, orderBook, error, sendMessage } = useWebSocket(CONFIG.mexcWsUrl, symbol);
  
  // Используем реальные данные если API настроен, иначе данные от браузера/WebSocket
  const { 
    orderBook: realOrderBook, 
    isLoading: realOrderBookLoading, 
    error: realOrderBookError 
  } = useRealOrderBook(symbol, currentProfile?.apiKey, currentProfile?.apiSecret);
  
  const { orderBook: processedOrderBook, marketSummary, maxVolume } = useOrderBook(
    browserOrderBook || realOrderBook || orderBook
  );
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
    const interval = setInterval(checkLocalStorage, 16); // 60 FPS = ~16.67ms

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
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header />
      
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {activeTab === 'trading' ? (
          <>
            {/* Symbol Selection and Favorites */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsSymbolPickerOpen(true)}
                className="px-4 py-2 bg-slate-800/60 border border-slate-600/50 text-slate-200 hover:bg-slate-700/50 transition-colors"
              >
                Выбрать тикер: {symbol}
              </button>
              <FavoritesBar
                currentSymbol={symbol}
                onSymbolChange={handleSymbolChange}
              />
            </div>
            
            {(error || realOrderBookError) && (
              <div className="text-sm text-red-400 mt-2">
                Error: {error || realOrderBookError}
              </div>
            )}

            {/* User Profiles */}
            <ProfilesBar />

            {/* Browser Connection */}
            <BrowserConnection
              onConnectionStatus={handleBrowserConnection}
              onOrderBookData={handleBrowserOrderBook}
              currentTicker={symbol}
            />

            {/* Market Summary */}
            <MarketSummary
              summary={marketSummary}
              isConnected={browserConnected || isConnected}
              symbol={symbol}
              browserConnected={browserConnected}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Order Book */}
              <div className="lg:col-span-2">
                <ProfessionalOrderBook
                  orderBook={processedOrderBook}
                  maxVolume={maxVolume}
                  onPriceClick={handlePriceClick}
                  symbol={symbol}
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

              {/* Balance Display */}
              <div>
                <BalanceDisplay
                  apiKey={currentProfile?.apiKey}
                  apiSecret={currentProfile?.apiSecret}
                  symbol={symbol.split('_')[1]} // Extract base currency
                  isApiConfigured={isApiConfigured}
                />
              </div>
            </div>

            {/* My Orders */}
            <MyOrders orders={orders} onCancelOrder={handleCancelOrder} />

            {/* Connection Status */}
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-2">
                {/* WebSocket Status */}
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
                    ? `WebSocket Connected`
                    : 'WebSocket Disconnected'}
                </div>
                
                {/* Browser Connection Status */}
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    browserConnected ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      browserConnected ? 'bg-white' : 'bg-white animate-pulse'
                    }`}
                  />
                  {browserConnected ? 'Browser Connected' : 'Browser Disconnected'}
                </div>
                
                {/* Real Data Status */}
                {isApiConfigured && (
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      realOrderBook && !realOrderBookLoading ? 'bg-purple-500 text-white' : 'bg-yellow-500 text-white'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        realOrderBook && !realOrderBookLoading ? 'bg-white' : 'bg-white animate-pulse'
                      }`}
                    />
                    {realOrderBookLoading ? 'Loading Real Data...' : 
                     realOrderBook ? 'Real Data Active' : 'Real Data Error'}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <AssessmentZone />
        )}
      </div>
      
      {/* Modals */}
      <SymbolPickerModal
        isOpen={isSymbolPickerOpen}
        onClose={() => setIsSymbolPickerOpen(false)}
        onSelect={handleSymbolChange}
        currentSymbol={symbol}
      />
      
      <ExtensionPanel
        isOpen={isExtensionPanelOpen}
        onClose={() => setIsExtensionPanelOpen(false)}
      />
      
      <ProfileCreateModal />
    </div>
  );
}

export default App;
