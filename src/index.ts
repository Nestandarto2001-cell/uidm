import { startHttpServer } from "./server";
import { MexcApi } from "./mexc_ccxt";
import { MexcBrowser } from "./browser";
import { CONFIG } from "./config";
import { log } from "./logger";
import { errorHandler } from "./errorHandler";
import { HealthChecker } from "./healthCheck";
import { tradingRateLimitMiddleware } from "./rateLimiter";
import { initializeBackupStrategies } from "./backupStrategy";

type OB = { bids: [number,number][], asks: [number,number][] };

const api = new MexcApi({
  // Если есть ключи — впишите. Если нет, часть через API просто будет скипаться.
  apiKey: process.env.MEXC_KEY,
  secret: process.env.MEXC_SECRET
});

(async () => {
  // Инициализируем резервные стратегии
  const backupStrategies = initializeBackupStrategies();
  
  const browser = new MexcBrowser();
  const healthChecker = new HealthChecker(api, browser);
  const { wss } = startHttpServer(healthChecker);
  
  // Подписываемся на изменения статуса браузера
  browser.onStatusChange((status) => {
    const payload = JSON.stringify({ 
      type: "browserStatus", 
      payload: status 
    });
    wss.clients.forEach((c: any) => { 
      try { c.send(payload); } catch {} 
    });
    
    if (!status.working) {
      log.error("Браузер не работает", { error: status.error });
    } else {
      log.info("Браузер работает нормально");
    }
  });
  
  await browser.start();

  let symbol = "YNE"; // дефолт
  let lastOB: OB = { bids: [], asks: [] };

  async function fetchOB(): Promise<OB> {
    try {
      if (await api.canTrade(symbol)) {
        const ob = await api.orderBook(symbol) as any;
        const processedOB = {
          bids: ob.bids.map(([p,q]: any)=>[Number(p), Number(q)]),
          asks: ob.asks.map(([p,q]: any)=>[Number(p), Number(q)]),
        };
        
        // Кэшируем данные
        backupStrategies.cacheStrategy.set(`orderbook:${symbol}`, processedOB, 5000); // 5 секунд
        
        return processedOB;
      } else {
        await browser.gotoSpot(symbol);
        const ob = await browser.readOrderBook();
        
        // Кэшируем данные браузера
        backupStrategies.cacheStrategy.set(`orderbook:browser:${symbol}`, ob, 10000); // 10 секунд
        
        return ob;
      }
    } catch (e) {
      log.error("OB error", { symbol, error: e instanceof Error ? e.message : String(e) });
      
      // Пытаемся получить данные из кэша
      const cachedData = backupStrategies.cacheStrategy.get(`orderbook:${symbol}`) ||
                        backupStrategies.cacheStrategy.get(`orderbook:browser:${symbol}`);
      
      if (cachedData) {
        log.info("Using cached orderbook data", { symbol });
        return cachedData;
      }
      
      return lastOB;
    }
  }

  // вебсокеты: команды UI
  wss.on("connection", (ws: any) => {
    ws.on("message", async (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "setSymbol") {
          symbol = String(msg.symbol || "").toUpperCase();
          // сразу подтянуть страницу, если надо
          try { await browser.gotoSpot(symbol); } catch {}
        } else if (msg.type === "order") {
          // Проверяем rate limit для торговых операций
          if (!tradingRateLimitMiddleware(ws, { socket: { remoteAddress: 'unknown' } })) {
            return;
          }
          
          const { kind, side, price, amount } = msg.payload || {};
          const useApi = await api.canTrade(symbol);
          
          log.trade("order_attempt", symbol, {
            kind,
            side,
            price,
            amount,
            method: useApi ? "api" : "browser"
          });
          
          if (useApi) {
            // через API
            await api.createOrder(symbol, side, kind, amount, price);
            log.trade("order_success", symbol, { method: "api", kind, side });
          } else {
            // через браузер
            if (kind === "limit") {
              await browser.placeLimit(side, Number(price), Number(amount));
              log.trade("order_success", symbol, { method: "browser", kind: "limit", side });
            } else {
              await browser.placeMarket(side, Number(amount));
              log.trade("order_success", symbol, { method: "browser", kind: "market", side });
            }
          }
        }
      } catch (e:any) {
        log.error("WebSocket message error", { 
          error: e?.message || "unknown error",
          message: raw.toString()
        });
        ws.send(JSON.stringify({type:"error", payload: e?.message || "unknown error"}));
      }
    });
  });

  // периодический пуллинг стакана
  setInterval(async () => {
    const ob = await fetchOB();
    if (ob && (ob.asks.length || ob.bids.length)) {
      lastOB = ob;
      const payload = JSON.stringify({ type: "orderbook", payload: ob });
      wss.clients.forEach((c: any) => { try { c.send(payload); } catch {} });
    }
  }, CONFIG.pollMs);

  // периодическая проверка здоровья системы
  setInterval(async () => {
    try {
      const health = await healthChecker.checkHealth();
      if (health.status !== 'healthy') {
        log.warn("System health degraded", { 
          status: health.status,
          components: Object.keys(health.components).filter(
            key => health.components[key as keyof typeof health.components].status !== 'healthy'
          )
        });
      }
    } catch (error) {
      log.error("Health check failed", { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }, 60000); // каждую минуту

  // Graceful shutdown
  process.on("SIGINT", () => {
    errorHandler.gracefulShutdown("SIGINT", async () => {
      log.info("Stopping browser...");
      await browser.stop();
      log.info("Application stopped gracefully");
    });
  });

  process.on("SIGTERM", () => {
    errorHandler.gracefulShutdown("SIGTERM", async () => {
      log.info("Stopping browser...");
      await browser.stop();
      log.info("Application stopped gracefully");
    });
  });
})();
