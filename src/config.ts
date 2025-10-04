export const CONFIG = {
    // UID для авторизации (вставьте ваш UID из cookies браузера)
    mexcUid: process.env.MEXC_UID || "",
    // Базовый язык/локаль страницы — подберите под ваш интерфейс МEXC
    mexcBaseUrl: "https://www.mexc.com",
    // Путь страницы спота: /exchange/<SYMBOL>_USDT
    spotPath: (symbol: string) => `/ru-RU/exchange/${symbol}_USDT`,
    // Тайминги
    pollMs: 1000,
    headless: true,
    // Настройки мониторинга
    statusCheckInterval: 30000, // проверка статуса каждые 30 секунд
    maxRetries: 3, // максимальное количество попыток
};