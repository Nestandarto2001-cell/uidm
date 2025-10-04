import { chromium, Browser, Page } from "playwright";
import fs from "fs/promises";
import path from "path";
import { CONFIG } from "./config";

export class MexcBrowser {
  private browser!: Browser;
  private page!: Page;

  async start() {
    this.browser = await chromium.launch({ headless: CONFIG.headless });
    const ctx = await this.browser.newContext();
    // Применяем cookies
    try {
      const cookiesRaw = await fs.readFile(path.resolve(CONFIG.cookiesPath), "utf-8");
      const state = JSON.parse(cookiesRaw);
      if (state.cookies) {
        await ctx.addCookies(state.cookies);
      }
    } catch (error) {
      console.warn("Не удалось загрузить cookies:", error);
    }
    this.page = await ctx.newPage();
  }

  async gotoSpot(symbol: string) {
    const url = CONFIG.mexcBaseUrl + CONFIG.spotPath(symbol);
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    // Подождём блок стакана
    await this.page.waitForTimeout(1500);
  }

  async readOrderBook(): Promise<{ bids: [number, number][], asks: [number, number][] }> {
    // DOM у МEXC может меняться. Делаем стратегию: искать по “слоям” текста и ролям.
    // Ниже — универсальные селекторы с fallback.
    const asks: [number, number][] = [];
    const bids: [number, number][] = [];

    // Примерные контейнеры. При необходимости поправите селекторы под актуальную разметку.
    const askRows = await this.page.$$('[data-testid="asks"] tr, .asks tr, [data-qa="order-asks"] tr');
    for (const r of askRows.slice(0, 50)) {
      const tds = await r.$$eval("td", (t: HTMLElement[]) => t.map((n: HTMLElement) => n.innerText.trim()));
      if (tds.length >= 2) {
        const p = Number((tds[0]||"").replace(/[^\d.]/g,""));
        const q = Number((tds[1]||"").replace(/[^\d.]/g,""));
        if (p && q) asks.push([p, q]);
      }
    }

    const bidRows = await this.page.$$('[data-testid="bids"] tr, .bids tr, [data-qa="order-bids"] tr');
    for (const r of bidRows.slice(0, 50)) {
      const tds = await r.$$eval("td", (t: HTMLElement[]) => t.map((n: HTMLElement) => n.innerText.trim()));
      if (tds.length >= 2) {
        const p = Number((tds[0]||"").replace(/[^\d.]/g,""));
        const q = Number((tds[1]||"").replace(/[^\d.]/g,""));
        if (p && q) bids.push([p, q]);
      }
    }

    // fallback: иногда столбцы идут наоборот (кол-во/цена). Добавьте проверку — где больше дробей в “цене”.
    const normalize = (arr: [number, number][]) =>
      arr.sort((a,b) => a[0]-b[0]); // ask по возрастанию, bid — вы отсортируете на UI

    return { bids: normalize(bids), asks: normalize(asks) };
  }

  async selectLimitTab() {
    // Попробуем кликнуть “Лимит”
    const limitBtn = await this.page.locator('button:has-text("Лимит"), [role="tab"]:has-text("Лимит")').first();
    if (await limitBtn.count()) await limitBtn.click();
  }

  async placeLimit(side: "buy"|"sell", price: number, amount: number) {
    await this.selectLimitTab();

    // Поиск полей цены/количества (несколько стратегий)
    const priceInput = this.page.locator('input[placeholder*="Цена"], input[name*="price"], input[aria-label*="Цена"]').first();
    const qtyInput   = this.page.locator('input[placeholder*="Кол"], input[name*="amount"], input[aria-label*="Кол"]').first();

    await priceInput.fill(String(price));
    await qtyInput.fill(String(amount));

    // Кнопки купить/продать
    const buyBtn  = this.page.locator('button:has-text("Купить"), button:has-text("Buy")').first();
    const sellBtn = this.page.locator('button:has-text("Продать"), button:has-text("Sell")').first();

    const btn = side === "buy" ? buyBtn : sellBtn;
    await btn.click();

    // Если всплывёт подтверждение — жмём подтверждение:
    const confirm = this.page.locator('button:has-text("Подтвердить"), button:has-text("Confirm")').first();
    if (await confirm.count()) await confirm.click();
  }

  async placeMarket(side: "buy"|"sell", amount: number) {
    // Переключиться на “Рынок”
    const marketBtn = await this.page.locator('button:has-text("Рынок"), [role="tab"]:has-text("Рынок")').first();
    if (await marketBtn.count()) await marketBtn.click();

    const qtyInput   = this.page.locator('input[placeholder*="Кол"], input[name*="amount"], input[aria-label*="Кол"]').first();
    await qtyInput.fill(String(amount));

    const buyBtn  = this.page.locator('button:has-text("Купить"), button:has-text("Buy")').first();
    const sellBtn = this.page.locator('button:has-text("Продать"), button:has-text("Sell")').first();
    await (side === "buy" ? buyBtn : sellBtn).click();

    const confirm = this.page.locator('button:has-text("Подтвердить"), button:has-text("Confirm")').first();
    if (await confirm.count()) await confirm.click();
  }

  pageRef() { return this.page; }

  async stop() { await this.browser?.close(); }
}
