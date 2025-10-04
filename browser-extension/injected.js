// Injected script for MEXC page
console.log('[INJECTED] Script injected into MEXC page');

// Этот скрипт будет инжектироваться в страницу MEXC
// для дополнительной функциональности если потребуется

// Отправляем сообщение о том, что скрипт загружен
window.postMessage({
  type: 'INJECTED_SCRIPT_LOADED',
  payload: {
    timestamp: Date.now(),
    url: window.location.href
  }
}, '*');
