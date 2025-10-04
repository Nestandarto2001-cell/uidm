import { startHttpServer } from "./server";
import { MexcApi } from "./mexc_ccxt";
import { MexcBrowser } from "./browser";
import { CONFIG } from "./config";

type OB = { bids: [number,number][], asks: [number,number][] };

const api = new MexcApi({
  // Если есть ключи — впишите. Если нет, часть через API просто будет скипаться.
  apiKey: process.env.MEXC_KEY,
  secret: process.env.MEXC_SECRET
});

(async () => {
  const { wss } = startHttpServer();
  const browser = new MexcBrowser();
  
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
      console.error(`❌ Браузер не работает: ${status.error}`);
    } else {
      console.log("✅ Браузер работает нормально");
    }
  });
  
  await browser.start();

  let symbol = "YNE"; // дефолт
  let lastOB: OB = { bids: [], asks: [] };

  async function fetchOB(): Promise<OB> {
    try {
      if (await api.canTrade(symbol)) {
        const ob = await api.orderBook(symbol);
        return {
          bids: ob.bids.map(([p,q]: any)=>[Number(p), Number(q)]),
          asks: ob.asks.map(([p,q]: any)=>[Number(p), Number(q)]),
        };
      } else {
        await browser.gotoSpot(symbol);
        return await browser.readOrderBook();
      }
    } catch (e) {
      console.error("OB error", e);
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
          const { kind, side, price, amount } = msg.payload || {};
          if (await api.canTrade(symbol)) {
            // через API
            await api.createOrder(symbol, side, kind, amount, price);
          } else {
            // через браузер
            if (kind === "limit") await browser.placeLimit(side, Number(price), Number(amount));
            else await browser.placeMarket(side, Number(amount));
          }
        }
      } catch (e:any) {
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

  process.on("SIGINT", async () => {
    await browser.stop();
    process.exit(0);
  });
})();
