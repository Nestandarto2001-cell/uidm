import ccxt from "ccxt";

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
    await this.ex.loadMarkets();
    return this.ex.markets[symbol + "/USDT"] ? true : false;
  }

  async orderBook(symbol: string) {
    return this.ex.fetchOrderBook(symbol + "/USDT", 50);
  }

  async createOrder(symbol: string, side: "buy"|"sell", type: "limit"|"market", amount: number, price?: number) {
    const pair = symbol + "/USDT";
    if (type === "market") {
      return this.ex.createOrder(pair, "market", side, amount);
    }
    if (price === undefined) throw new Error("Price required for limit");
    return this.ex.createOrder(pair, "limit", side, amount, price);
  }
}
