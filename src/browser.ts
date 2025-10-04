import { chromium, Browser, Page } from "playwright";
import { CONFIG } from "./config";
import { log } from "./logger";
import { errorHandler, AppError } from "./errorHandler";

export class MexcBrowser {
  private browser!: Browser;
  private page!: Page;
  private isWorking: boolean = false;
  private retryCount: number = 0;
  private statusCallbacks: ((status: { working: boolean, error?: string }) => void)[] = [];

  async start() {
    if (!CONFIG.mexcUid) {
      log.error("MEXC_UID не установлен", { 
        error: "MEXC_UID не установлен! Установите переменную окружения MEXC_UID или добавьте в config.ts" 
      });
      throw new AppError("MEXC_UID не установлен! Установите переменную окружения MEXC_UID или добавьте в config.ts", 400);
    }

    try {
      log.browser("Starting browser", { headless: CONFIG.headless });
      
      this.browser = await errorHandler.withTimeout(
        chromium.launch({ headless: CONFIG.headless }),
        CONFIG.browserTimeout,
        "Browser launch"
      );
      
      const ctx = await this.browser.newContext();
    
    // Устанавливаем UID cookie
    await ctx.addCookies([{
      name: 'u_id',
      value: CONFIG.mexcUid,
      domain: '.mexc.com',
      path: '/',
      httpOnly: true,
      secure: true
    }]);
    
    this.page = await ctx.newPage();
    
      // Проверяем статус авторизации
      await this.checkAuthStatus();
      
      // Запускаем мониторинг статуса
      this.startStatusMonitoring();
      
    } catch (error) {
      log.error("Failed to start browser", { error: error instanceof Error ? error.message : String(error) });
      errorHandler.handleBrowserError(error, "Browser start");
    }
  }

  onStatusChange(callback: (status: { working: boolean, error?: string }) => void) {
    this.statusCallbacks.push(callback);
  }

  private notifyStatus(working: boolean, error?: string) {
    this.isWorking = working;
    this.statusCallbacks.forEach(callback => callback({ working, error }));
  }

  private async checkAuthStatus(): Promise<boolean> {
    try {
      await this.page.goto(CONFIG.mexcBaseUrl, { waitUntil: "domcontentloaded" });
      await this.page.waitForTimeout(2000);
      
      // Проверяем наличие элементов, указывающих на авторизацию
      const isLoggedIn = await this.page.evaluate(() => {
        // Ищем элементы, которые появляются только у авторизованных пользователей
        return document.querySelector('[data-testid="user-menu"], .user-info, [class*="user"], [class*="profile"]') !== null ||
               !document.querySelector('[data-testid="login"], .login-btn, [class*="login"]');
      });
      
      if (isLoggedIn) {
        this.retryCount = 0;
        this.notifyStatus(true);
        log.auth("success", { retryCount: this.retryCount });
        return true;
      } else {
        this.notifyStatus(false, "Не авторизован - проверьте UID");
        log.auth("failed", { reason: "Не авторизован - проверьте UID" });
        return false;
      }
    } catch (error) {
      this.notifyStatus(false, `Ошибка проверки авторизации: ${error}`);
      log.auth("failed", { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  private startStatusMonitoring() {
    setInterval(async () => {
      if (this.retryCount >= CONFIG.maxRetries) {
        this.notifyStatus(false, "Превышено максимальное количество попыток - требуется новый UID");
        console.error("❌ Превышено максимальное количество попыток - требуется новый UID");
        return;
      }
      
      const isWorking = await this.checkAuthStatus();
      if (!isWorking) {
        this.retryCount++;
        console.warn(`⚠️ Попытка ${this.retryCount}/${CONFIG.maxRetries} - авторизация не работает`);
      }
    }, CONFIG.statusCheckInterval);
  }

  async gotoSpot(symbol: string) {
    if (!this.isWorking) {
      throw new Error("Браузер не авторизован - проверьте UID");
    }
    
    const url = CONFIG.mexcBaseUrl + CONFIG.spotPath(symbol);
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    // Подождём блок стакана
    await this.page.waitForTimeout(1500);
  }

  getStatus() {
    return {
      working: this.isWorking,
      retryCount: this.retryCount,
      maxRetries: CONFIG.maxRetries
    };
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
    if (!this.isWorking) {
      throw new AppError("Браузер не авторизован - проверьте UID", 401);
    }
    
    try {
      log.trade("placeLimit_attempt", "", { side, price, amount });
      
      await errorHandler.withRetry(
        async () => {
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
        },
        CONFIG.apiRetries,
        1000,
        "placeLimit"
      );
      
      log.trade("placeLimit_success", "", { side, price, amount });
      
    } catch (error) {
      log.error("placeLimit failed", { side, price, amount, error: error instanceof Error ? error.message : String(error) });
      errorHandler.handleBrowserError(error, "placeLimit");
    }
  }

  async placeMarket(side: "buy"|"sell", amount: number) {
    if (!this.isWorking) {
      throw new AppError("Браузер не авторизован - проверьте UID", 401);
    }
    
    try {
      log.trade("placeMarket_attempt", "", { side, amount });
      
      await errorHandler.withRetry(
        async () => {
          // Переключиться на "Рынок"
          const marketBtn = await this.page.locator('button:has-text("Рынок"), [role="tab"]:has-text("Рынок")').first();
          if (await marketBtn.count()) await marketBtn.click();

          const qtyInput   = this.page.locator('input[placeholder*="Кол"], input[name*="amount"], input[aria-label*="Кол"]').first();
          await qtyInput.fill(String(amount));

          const buyBtn  = this.page.locator('button:has-text("Купить"), button:has-text("Buy")').first();
          const sellBtn = this.page.locator('button:has-text("Продать"), button:has-text("Sell")').first();
          await (side === "buy" ? buyBtn : sellBtn).click();

          const confirm = this.page.locator('button:has-text("Подтвердить"), button:has-text("Confirm")').first();
          if (await confirm.count()) await confirm.click();
        },
        CONFIG.apiRetries,
        1000,
        "placeMarket"
      );
      
      log.trade("placeMarket_success", "", { side, amount });
      
    } catch (error) {
      log.error("placeMarket failed", { side, amount, error: error instanceof Error ? error.message : String(error) });
      errorHandler.handleBrowserError(error, "placeMarket");
    }
  }

  pageRef() { return this.page; }

  async stop() { await this.browser?.close(); }
}
