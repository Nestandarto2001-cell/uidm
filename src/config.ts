/**
 * Web application configuration for MEXC trading terminal
 */

// Raw configuration for web application
const rawConfig = {
  // API Configuration
  mexcKey: "",
  mexcSecret: "",
  
  // MEXC Configuration
  mexcBaseUrl: "https://api.mexc.com",
  mexcWsUrl: "wss://wbs.mexc.com/ws",
  
  // Trading Configuration
  defaultSymbol: "BTCUSDT",
  defaultOrderType: "LIMIT",
  defaultSide: "BUY",
  
  // API Configuration
  apiTimeout: 10000, // 10 seconds
  apiRetries: 3,
  
  // Rate Limiting Configuration
  orderRateLimitPerMin: 30,
  wsRateLimitPerMin: 120,
  
  // WebSocket Configuration
  wsReconnectInterval: 5000, // 5 seconds
  wsMaxReconnectAttempts: 10,
  
  // UI Configuration
  updateInterval: 1000, // 1 second
  maxOrderBookDepth: 20,
  maxTradeHistory: 100,
};

// Export configuration
export const CONFIG = rawConfig;

// Helper functions
export const getApiConfig = () => {
  if (CONFIG.mexcKey && CONFIG.mexcSecret) {
    return {
      apiKey: CONFIG.mexcKey,
      secret: CONFIG.mexcSecret
    };
  }
  return null;
};

export const setApiCredentials = (key: string, secret: string) => {
  CONFIG.mexcKey = key;
  CONFIG.mexcSecret = secret;
};

export const hasApiCredentials = (): boolean => {
  return !!(CONFIG.mexcKey && CONFIG.mexcSecret);
};