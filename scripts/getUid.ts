import { chromium } from "playwright";

(async () => {
  console.log("🔍 Запуск браузера для получения UID...");
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Открываем MEXC
  await page.goto("https://www.mexc.com/ru-RU", { waitUntil: "domcontentloaded" });

  console.log("\n📋 ИНСТРУКЦИЯ:");
  console.log("1. Войдите в свой аккаунт MEXC в открывшемся браузере");
  console.log("2. После входа нажмите F12 для открытия DevTools");
  console.log("3. Перейдите на вкладку 'Application' (или 'Приложение')");
  console.log("4. В левом меню выберите 'Cookies' -> 'https://www.mexc.com'");
  console.log("5. Найдите cookie с именем 'u_id' и скопируйте его значение");
  console.log("6. Вернитесь в терминал и вставьте UID\n");

  console.log("⏳ Ожидание входа в аккаунт...");
  console.log("(Нажмите Enter когда получите UID)");

  // Ждем нажатия Enter
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });

  // Получаем cookies
  const cookies = await context.cookies("https://www.mexc.com");
  const uidCookie = cookies.find(c => c.name === 'u_id');

  if (uidCookie) {
    console.log("\n✅ UID найден!");
    console.log(`UID: ${uidCookie.value}`);
    console.log("\n📝 Для использования добавьте в config.ts:");
    console.log(`mexcUid: "${uidCookie.value}",`);
    console.log("\nИли установите переменную окружения:");
    console.log(`set MEXC_UID=${uidCookie.value}`);
  } else {
    console.log("\n❌ UID не найден!");
    console.log("Убедитесь, что вы вошли в аккаунт и cookie 'u_id' существует.");
  }

  await browser.close();
  process.exit(0);
})();
