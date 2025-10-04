import { useEffect, useRef, useState } from 'react';
import { WebSocketMessage, OrderBookData } from '../types';

export const useWebSocket = (url: string, symbol?: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = () => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected to MEXC');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // Subscribe to order book data for the symbol
        if (symbol) {
          const subscribeMessage = {
            method: 'SUBSCRIPTION',
            params: [`spot@public.deals.v3.api@${symbol}`]
          };
          ws.send(JSON.stringify(subscribeMessage));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle MEXC WebSocket response
          if (data.c && data.d) {
            // This is order book data from MEXC
            const orderBookData: OrderBookData = {
              bids: data.d.bids || [],
              asks: data.d.asks || []
            };
            setOrderBook(orderBookData);
          } else if (data.code === 0) {
            // Subscription successful
            console.log('Successfully subscribed to', data.data);
          } else {
            console.log('MEXC WebSocket message:', data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError('Connection lost. Please refresh the page.');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

      setSocket(ws);
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect to server');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socket) {
      socket.close();
    }
  };

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [url, symbol]);

  return {
    isConnected,
    orderBook,
    error,
    sendMessage,
    reconnect: connect,
  };
};
