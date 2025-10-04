import ccxt from "ccxt";
import { CONFIG } from "./config";

export class MexcApi {
  private ex: any;
  
  constructor(opts?: { apiKey?: string; secret?: string }) {
    this.ex = new ccxt.mexc({
      apiKey: opts?.apiKey,
      secret: opts?.secret,
      enableRateLimit: true,
      timeout: CONFIG.apiTimeout,
      sandbox: false, // Use production API
    });

    console.log("MexcApi initialized", {
      hasApiKeys: !!(opts?.apiKey && opts?.secret),
      timeout: CONFIG.apiTimeout
    });
  }

  async canTrade(symbol: string) {
    try {
      await this.ex.loadMarkets();
      const marketExists = this.ex.markets[symbol + "/USDT"] ? true : false;
      console.log("canTrade", symbol, marketExists ? "available" : "not available");
      return marketExists;
    } catch (error) {
      console.error("canTrade error:", error);
      return false;
    }
  }

  async orderBook(symbol: string) {
    try {
      const orderBook = await this.ex.fetchOrderBook(symbol + "/USDT", 50);
      console.log("orderBook", symbol, {
        bidsCount: orderBook.bids?.length || 0,
        asksCount: orderBook.asks?.length || 0
      });
      return orderBook;
    } catch (error) {
      console.error("orderBook error:", error);
      throw new Error(`Failed to fetch order book for ${symbol}`);
    }
  }

  async createOrder(symbol: string, side: "buy"|"sell", type: "limit"|"market", amount: number, price?: number) {
    try {
      const pair = symbol + "/USDT";
      
      if (type === "limit" && price === undefined) {
        throw new Error("Price required for limit order");
      }
      
      let order;
      if (type === "market") {
        order = await this.ex.createOrder(pair, "market", side, amount);
      } else {
        order = await this.ex.createOrder(pair, "limit", side, amount, price);
      }
      
      console.log("createOrder success", symbol, { 
        type, 
        side, 
        amount, 
        price, 
        orderId: order.id
      });
      
      return order;
    } catch (error) {
      console.error("createOrder failed", symbol, { 
        type, 
        side, 
        amount, 
        price,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to create ${type} order for ${symbol}`);
    }
  }

  async cancelOrder(orderId: string, symbol: string) {
    try {
      const result = await this.ex.cancelOrder(orderId, symbol + "/USDT");
      console.log("cancelOrder success", { orderId, symbol });
      return result;
    } catch (error) {
      console.error("cancelOrder failed", { orderId, symbol, error });
      throw new Error(`Failed to cancel order ${orderId}`);
    }
  }

  async fetchBalance() {
    try {
      const balance = await this.ex.fetchBalance();
      console.log("fetchBalance success");
      return balance;
    } catch (error) {
      console.error("fetchBalance failed", error);
      throw new Error("Failed to fetch balance");
    }
  }
}
