import { chromium } from "playwright";
import fs from "fs/promises";

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1) Открой сайт и ВОЙДИ В АККАУНТ ВРУЧНУЮ (почта/2FA/captcha)
  await page.goto("https://www.mexc.com/ru-RU", { waitUntil: "domcontentloaded" });

  console.log("\n>>> Войди в аккаунт на открывшейся странице. Когда увидишь свой профиль/баланс — возвращайся в терминал и просто подожди…\n");

  // 2) Ждём появления auth-куков и сохраняем сторедж
  // Проверяем циклом до 2 минут
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const cookies = await context.cookies("https://www.mexc.com");
    const hasAuth = cookies.some((c: any) => /u_id|mexc_token|auth|token/i.test(c.name));
    if (hasAuth) break;
    await page.waitForTimeout(1500);
  }

  const state = await context.storageState();
  await fs.writeFile("./cookies.json", JSON.stringify(state, null, 2), "utf-8");
  console.log("✅ cookies.json сохранён в корне проекта.");

  await browser.close();
})();
