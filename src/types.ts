export interface OrderBookEntry {
  price: number;
  amount: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface OrderBookData {
  bids: [number, number][];
  asks: [number, number][];
}

export interface MarketSummary {
  symbol: string;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: number;
  amount: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'orderbook' | 'order' | 'cancelOrder' | 'error';
  payload: any;
}

export interface MexcOrderBookData {
  c: string; // channel
  d: {
    bids: [number, number][];
    asks: [number, number][];
  };
}
