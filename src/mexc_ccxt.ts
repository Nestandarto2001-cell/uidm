import ccxt from "ccxt";
import { log } from "./logger";
import { errorHandler, AppError } from "./errorHandler";
import { CONFIG } from "./config";
import { backupManager } from "./backupStrategy";

export class MexcApi {
  private ex: any;
  constructor(opts?: { apiKey?: string; secret?: string }) {
    this.ex = new ccxt.mexc({
      apiKey: opts?.apiKey,
      secret: opts?.secret,
      enableRateLimit: true
    });
  }

  async canTrade(symbol: string) {
    try {
      await errorHandler.withTimeout(
        this.ex.loadMarkets(),
        CONFIG.apiTimeout,
        "loadMarkets"
      );
      
      const marketExists = this.ex.markets[symbol + "/USDT"] ? true : false;
      log.api("canTrade", symbol, marketExists ? 200 : 404);
      return marketExists;
    } catch (error) {
      log.error("canTrade failed", { symbol, error: error instanceof Error ? error.message : String(error) });
      errorHandler.handleApiError(error, "canTrade");
    }
  }

  async orderBook(symbol: string) {
    try {
      const startTime = Date.now();
      
      const orderBook = await backupManager.executeWithFallback(
        async () => {
          return await errorHandler.withTimeout(
            this.ex.fetchOrderBook(symbol + "/USDT", 50),
            CONFIG.apiTimeout,
            "fetchOrderBook"
          );
        }
      );
      
      const duration = Date.now() - startTime;
      log.api("orderBook", symbol, 200, duration);
      return orderBook;
    } catch (error) {
      log.error("orderBook failed", { symbol, error: error instanceof Error ? error.message : String(error) });
      errorHandler.handleApiError(error, "orderBook");
    }
  }

  async createOrder(symbol: string, side: "buy"|"sell", type: "limit"|"market", amount: number, price?: number) {
    try {
      const pair = symbol + "/USDT";
      
      if (type === "limit" && price === undefined) {
        throw new AppError("Price required for limit order", 400);
      }
      
      const startTime = Date.now();
      const order = await errorHandler.withRetry(
        async () => {
          if (type === "market") {
            return await this.ex.createOrder(pair, "market", side, amount);
          } else {
            return await this.ex.createOrder(pair, "limit", side, amount, price);
          }
        },
        CONFIG.apiRetries,
        1000,
        "createOrder"
      );
      
      const duration = Date.now() - startTime;
      log.trade("createOrder_success", symbol, { 
        type, 
        side, 
        amount, 
        price, 
        orderId: order.id,
        duration 
      });
      
      return order;
    } catch (error) {
      log.error("createOrder failed", { 
        symbol, 
        type, 
        side, 
        amount, 
        price, 
        error: error instanceof Error ? error.message : String(error) 
      });
      errorHandler.handleApiError(error, "createOrder");
    }
  }
}
