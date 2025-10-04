import express from "express";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startHttpServer() {
  const app = express();
  const server = app.listen(3000, () => console.log("UI: http://localhost:3000"));

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
</style>
</head><body>
<h2>MEXC Assessment Trader</h2>
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
      alert(msg.payload || "Error");
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
  return { app, wss };
}
