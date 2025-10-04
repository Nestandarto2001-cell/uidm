import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useOrderBook } from './hooks/useOrderBook';
import { MarketSummary } from './components/MarketSummary';
import { OrderBook } from './components/OrderBook';
import { OrderForm } from './components/OrderForm';
import { MyOrders } from './components/MyOrders';
import { ApiSettings } from './components/ApiSettings';
import { Order } from './types';
import { CONFIG, setApiCredentials, hasApiCredentials } from './config';

function App() {
  const [symbol, setSymbol] = useState<string>(CONFIG.defaultSymbol);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [isApiConfigured, setIsApiConfigured] = useState<boolean>(hasApiCredentials());
  
  const { isConnected, orderBook, error, sendMessage } = useWebSocket(CONFIG.mexcWsUrl, symbol);
  const { orderBook: processedOrderBook, marketSummary, maxVolume } = useOrderBook(orderBook);
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
    setApiKey(key);
    setApiSecret(secret);
    console.log('API credentials configured');
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    console.log('Symbol changed to:', newSymbol);
  };

  // Mock order updates
  useEffect(() => {
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
              <select 
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
              >
                <option value="BTCUSDT">BTC/USDT</option>
                <option value="ETHUSDT">ETH/USDT</option>
                <option value="ADAUSDT">ADA/USDT</option>
                <option value="SOLUSDT">SOL/USDT</option>
                <option value="DOTUSDT">DOT/USDT</option>
              </select>
              <div className={`px-3 py-1 rounded text-sm ${
                isApiConfigured ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}>
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

        {/* API Settings */}
        {!isApiConfigured && (
          <ApiSettings 
            onApiCredentials={handleApiCredentials}
          />
        )}

        {/* Market Summary */}
        <MarketSummary 
          summary={marketSummary} 
          isConnected={isConnected}
          symbol={symbol}
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
          <MyOrders
            orders={orders}
            onCancelOrder={handleCancelOrder}
          />
        </div>

        {/* Connection Status */}
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-white' : 'bg-white animate-pulse'
            }`} />
            {isConnected ? `Connected to ${symbol} WebSocket` : 'Disconnected from WebSocket'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
