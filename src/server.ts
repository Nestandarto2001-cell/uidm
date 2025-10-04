import express from "express";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "./logger";
import { HealthChecker } from "./healthCheck";
import { apiRateLimiter, healthRateLimiter, wsRateLimitMiddleware } from "./rateLimiter";
import { backupManager } from "./backupStrategy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startHttpServer(healthChecker?: HealthChecker) {
  const app = express();
  
  // Middleware для парсинга JSON
  app.use(express.json());
  
  const server = app.listen(3000, () => {
    log.info("HTTP server started", { port: 3000, url: "http://localhost:3000" });
  });

  // Health check endpoints с rate limiting
  app.get("/health", healthRateLimiter, async (_req: any, res: any) => {
    try {
      if (!healthChecker) {
        res.status(503).json({ 
          status: 'unhealthy', 
          message: 'Health checker not initialized' 
        });
        return;
      }
      
      const health = await healthChecker.checkHealth();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      log.error("Health check endpoint error", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      res.status(503).json({ 
        status: 'unhealthy', 
        message: 'Health check failed' 
      });
    }
  });

  app.get("/health/quick", healthRateLimiter, async (_req: any, res: any) => {
    try {
      if (!healthChecker) {
        res.status(503).json({ 
          status: 'unhealthy', 
          message: 'Health checker not initialized' 
        });
        return;
      }
      
      const status = await healthChecker.getQuickStatus();
      const statusCode = status.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json(status);
    } catch (error) {
      res.status(503).json({ 
        status: 'unhealthy', 
        message: 'Health check failed' 
      });
    }
  });

  // Backup strategies statistics endpoint
  app.get("/backup/stats", apiRateLimiter, (_req: any, res: any) => {
    try {
      const stats = backupManager.getFallbackStats();
      res.json(stats);
    } catch (error) {
      log.error("Backup stats endpoint error", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      res.status(500).json({ 
        error: 'Failed to get backup statistics' 
      });
    }
  });

  app.get("/", (_req: any, res: any) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`
<!doctype html><html><head><meta charset="utf-8"/>
<title>MEXC Trader</title>
<style>
  body{font:14px/1.4 system-ui, sans-serif; margin:20px;}
  #row{display:flex; gap:24px;}
  table{border-collapse:collapse; min-width:320px}
  th,td{border:1px solid #ddd; padding:4px 8px; text-align:right}
  canvas{border:1px solid #ddd;}
  .controls{display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px;}
  input{padding:6px 8px;}
  button{padding:6px 10px; cursor:pointer;}
  .status-indicator{padding:8px 12px; border-radius:4px; margin-bottom:12px; display:flex; align-items:center; gap:8px;}
  .status-working{background:#d4edda; color:#155724; border:1px solid #c3e6cb;}
  .status-error{background:#f8d7da; color:#721c24; border:1px solid #f5c6cb;}
  .status-connecting{background:#d1ecf1; color:#0c5460; border:1px solid #bee5eb;}
  .notification{position:fixed; top:20px; right:20px; padding:12px 16px; border-radius:4px; z-index:1000; max-width:300px;}
  .notification-error{background:#f8d7da; color:#721c24; border:1px solid #f5c6cb;}
  .notification-success{background:#d4edda; color:#155724; border:1px solid #c3e6cb;}
</style>
</head><body>
<h2>MEXC Assessment Trader</h2>
<div id="status" class="status-indicator">
  <span id="statusText">Подключение...</span>
  <span id="statusIcon">🔄</span>
</div>
<div class="controls">
  <input id="symbol" placeholder="SYMBOL (e.g. YNE)" />
  <button id="load">Load</button>
  <input id="price" placeholder="price"/>
  <input id="amount" placeholder="amount"/>
  <button id="buyL">Buy LIMIT</button>
  <button id="sellL">Sell LIMIT</button>
  <button id="buyM">Buy MARKET</button>
  <button id="sellM">Sell MARKET</button>
</div>
<div id="row">
  <div>
    <h3>Asks</h3>
    <table id="asks"><thead><tr><th>Price</th><th>Qty</th></tr></thead><tbody></tbody></table>
  </div>
  <div>
    <h3>Bids</h3>
    <table id="bids"><thead><tr><th>Price</th><th>Qty</th></tr></thead><tbody></tbody></table>
  </div>
  <div>
    <h3>Depth</h3>
    <canvas id="depth" width="420" height="280"></canvas>
  </div>
</div>
<script>
  const ws = new WebSocket("ws://"+location.host);
  let currentSymbol = "";

  ws.onmessage = (ev)=>{
    const msg = JSON.parse(ev.data);
    if(msg.type==="orderbook"){
      render(msg.payload);
    } else if (msg.type==="error"){
      showNotification(msg.payload || "Error", "error");
    } else if (msg.type==="browserStatus"){
      updateStatus(msg.payload);
    }
  };

  document.getElementById("load").onclick = ()=>{
    const s = document.getElementById("symbol").value.trim().toUpperCase();
    currentSymbol = s;
    ws.send(JSON.stringify({type:"setSymbol", symbol:s}));
  };

  const sendOrder = (kind, side)=>{
    const price = parseFloat(document.getElementById("price").value);
    const amount = parseFloat(document.getElementById("amount").value);
    ws.send(JSON.stringify({type:"order", payload:{kind, side, price, amount, symbol: currentSymbol}}));
  };
  document.getElementById("buyL").onclick = ()=>sendOrder("limit","buy");
  document.getElementById("sellL").onclick = ()=>sendOrder("limit","sell");
  document.getElementById("buyM").onclick = ()=>sendOrder("market","buy");
  document.getElementById("sellM").onclick = ()=>sendOrder("market","sell");

  function updateStatus(status) {
    const statusEl = document.getElementById("status");
    const statusText = document.getElementById("statusText");
    const statusIcon = document.getElementById("statusIcon");
    
    if (status.working) {
      statusEl.className = "status-indicator status-working";
      statusText.textContent = "Браузер работает";
      statusIcon.textContent = "✅";
    } else {
      statusEl.className = "status-indicator status-error";
      statusText.textContent = "Ошибка: " + (status.error || "Неизвестная ошибка");
      statusIcon.textContent = "❌";
      
      if (status.error && status.error.includes("UID")) {
        showNotification("Требуется новый UID! Проверьте настройки.", "error");
      }
    }
  }

  function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = "notification notification-" + type;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  function render(ob){
    const asksT = document.querySelector("#asks tbody");
    const bidsT = document.querySelector("#bids tbody");
    asksT.innerHTML = ob.asks.slice(0,20).map(([p,q])=>\`<tr><td>\${p}</td><td>\${q}</td></tr>\`).join("");
    bidsT.innerHTML = ob.bids.slice(0,20).map(([p,q])=>\`<tr><td>\${p}</td><td>\${q}</td></tr>\`).join("");

    const c = document.getElementById("depth");
    const ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);

    const toXY = (arr, x0, y0, w, h, isAsk)=>{
      const px = arr.map(([p])=>p);
      const min = Math.min(...px), max = Math.max(...px);
      const vol = arr.map(([,q])=>q);
      const vmax = Math.max(...vol);
      const pts = arr.map(([p,q],i)=>{
        const x = x0 + ( (p-min)/(max-min || 1) )*w;
        const y = y0 + h - (q/(vmax||1))*h;
        return [x,y];
      });
      return pts;
    };

    const askPts = toXY(ob.asks.slice(0,20), 10, 10, 190, 120, true);
    const bidPts = toXY(ob.bids.slice(0,20), 220, 10, 190, 120, false);

    const draw = (pts)=>{
      if(pts.length<2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    };
    draw(askPts);
    draw(bidPts);
  }
</script>
</body></html>`);
  });

  const wss = new WebSocketServer({ server });
  
  // Регистрируем WebSocket клиентов в health checker с rate limiting
  wss.on('connection', (ws, req) => {
    // Проверяем rate limit для WebSocket подключений
    if (!wsRateLimitMiddleware(ws, req)) {
      return;
    }
    
    if (healthChecker) {
      healthChecker.registerWebSocketClient(ws);
    }
    
    ws.on('close', () => {
      if (healthChecker) {
        healthChecker.unregisterWebSocketClient(ws);
      }
    });
  });
  
  return { app, wss };
}
