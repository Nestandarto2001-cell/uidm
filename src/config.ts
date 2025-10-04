export const CONFIG = {
    // Экспортируйте cookies из вашего браузера (JSON массив DevTools) и положите в project root как cookies.json
    cookiesPath: "./cookies.json",
    // Базовый язык/локаль страницы — подберите под ваш интерфейс МEXC
    mexcBaseUrl: "https://www.mexc.com",
    // Путь страницы спота: /exchange/<SYMBOL>_USDT
    spotPath: (symbol: string) => `/ru-RU/exchange/${symbol}_USDT`,
    // Тайминги
    pollMs: 1000,
    headless: true,
};