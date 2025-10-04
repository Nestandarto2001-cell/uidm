import { validateSystem } from './configValidation';

// Сырая конфигурация
const rawConfig = {
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
    // Настройки логирования
    logLevel: process.env.LOG_LEVEL || "info",
    logToFile: process.env.LOG_TO_FILE !== "false",
    // Настройки API
    apiTimeout: 10000, // 10 секунд
    apiRetries: 3,
    // Настройки браузера
    browserTimeout: 30000, // 30 секунд
    pageLoadTimeout: 10000, // 10 секунд
};

// Валидированная конфигурация
export const CONFIG = validateSystem(rawConfig);