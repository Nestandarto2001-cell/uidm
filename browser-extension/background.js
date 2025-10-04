// Background script для расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('MEXC Terminal Connector установлен');
});

// Слушаем сообщения от content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ORDERBOOK_DATA') {
    // Пересылаем данные в терминал
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'MEXC_ORDERBOOK_DATA',
          payload: request.payload
        });
      }
    });
  }
});

// Слушаем изменения вкладок
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('mexc.com')) {
    // Внедряем скрипт в загруженную страницу MEXC
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  }
});
