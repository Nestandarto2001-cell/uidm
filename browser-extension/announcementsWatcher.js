/**
 * Announcements Watcher for MEXC Assessment Zone
 * Service Worker module for monitoring assessment zone announcements
 */

// Configuration
const CONFIG = {
  searchUrl: 'https://www.mexc.com/ru-RU/announcements/search?query=оценочную+зону',
  checkInterval: 10, // minutes
  storageKey: 'assessmentZoneDB',
  portName: 'assessment-updates'
};

// Global state
let isRunning = false;
let lastCheckTime = null;

/**
 * Initialize the announcements watcher
 */
async function initAnnouncementsWatcher() {
  console.log('Initializing Announcements Watcher...');
  
  // Set up alarm for periodic checks
  await chrome.alarms.create('assessmentCheck', {
    delayInMinutes: 1, // First check in 1 minute
    periodInMinutes: CONFIG.checkInterval
  });
  
  // Listen for alarm events
  chrome.alarms.onAlarm.addListener(handleAlarm);
  
  // Listen for messages from content scripts
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Listen for port connections
  chrome.runtime.onConnect.addListener(handlePortConnection);
  
  console.log('Announcements Watcher initialized');
}

/**
 * Handle alarm events
 */
async function handleAlarm(alarm) {
  if (alarm.name === 'assessmentCheck' || alarm.name === 'assessmentCheckNow') {
    await performAssessmentCheck();
  }
}

/**
 * Handle messages from content scripts
 */
async function handleMessage(request, sender, sendResponse) {
  if (request.type === 'ASSESSMENT_CHECK_REQUEST') {
    await performAssessmentCheck();
    sendResponse({ success: true });
  } else if (request.type === 'ASSESSMENT_STATUS_REQUEST') {
    const status = await getWatcherStatus();
    sendResponse(status);
  }
}

/**
 * Handle port connections
 */
function handlePortConnection(port) {
  if (port.name === CONFIG.portName) {
    console.log('Assessment port connected');
    
    port.onDisconnect.addListener(() => {
      console.log('Assessment port disconnected');
    });
  }
}

/**
 * Perform assessment check
 */
async function performAssessmentCheck() {
  if (isRunning) {
    console.log('Assessment check already running, skipping...');
    return;
  }
  
  isRunning = true;
  console.log('Starting assessment check...');
  
  try {
    // Get current data
    const currentData = await getStoredData();
    const processedUrls = new Set(currentData.entries.map(entry => entry.announcementUrl));
    
    // Get announcement links
    const announcementLinks = await getAnnouncementLinks();
    console.log(`Found ${announcementLinks.length} announcement links`);
    
    // Process new announcements
    const newEntries = [];
    let processedCount = 0;
    
    for (const link of announcementLinks) {
      if (!processedUrls.has(link.url)) {
        try {
          const entries = await parseAnnouncementPage(link);
          newEntries.push(...entries);
          processedCount++;
          console.log(`Processed announcement: ${link.title} - ${entries.length} tokens`);
        } catch (error) {
          console.error(`Failed to parse announcement ${link.url}:`, error);
        }
      }
    }
    
    // Update stored data
    if (newEntries.length > 0) {
      await updateStoredData(newEntries);
      console.log(`Added ${newEntries.length} new assessment entries`);
      
      // Notify UI about updates
      notifyUI({
        type: 'ASSESS_UPDATE',
        payload: {
          newEntries,
          processedCount,
          totalEntries: newEntries.length
        }
      });
    }
    
    lastCheckTime = new Date().toISOString();
    console.log(`Assessment check completed. Processed: ${processedCount}, New entries: ${newEntries.length}`);
    
  } catch (error) {
    console.error('Assessment check failed:', error);
    
    // Notify UI about error
    notifyUI({
      type: 'ASSESS_ERROR',
      payload: { error: error.message }
    });
  } finally {
    isRunning = false;
  }
}

/**
 * Get announcement links from search page
 */
async function getAnnouncementLinks() {
  try {
    // Inject content script to get links
    const results = await chrome.scripting.executeScript({
      target: { tabId: null }, // Will be handled by content script
      func: extractAnnouncementLinks
    });
    
    return results[0]?.result || [];
  } catch (error) {
    console.error('Failed to get announcement links:', error);
    return [];
  }
}

/**
 * Function to extract announcement links (injected into page)
 */
function extractAnnouncementLinks() {
  const links = [];
  
  // Look for announcement links in various selectors
  const selectors = [
    'a[href*="/announcements/"]',
    'a[href*="/support/articles/"]',
    '.announcement-item a',
    '.news-item a',
    '.list-item a'
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const title = element.textContent?.trim();
      const href = element.href;
      
      if (title && href && title.toLowerCase().includes('оценочн')) {
        links.push({
          title,
          url: href,
          domain: window.location.hostname
        });
      }
    }
  }
  
  return links;
}

/**
 * Parse announcement page to extract assessment data
 */
async function parseAnnouncementPage(link) {
  try {
    // Create a new tab to parse the page
    const tab = await chrome.tabs.create({
      url: link.url,
      active: false
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Execute parsing script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: parseAssessmentTable
    });
    
    // Close the tab
    await chrome.tabs.remove(tab.id);
    
    const parsedData = results[0]?.result || { entries: [], parsedFrom: 'table' };
    
    // Add announcement URL to each entry
    return parsedData.entries.map(entry => ({
      ...entry,
      announcementUrl: link.url,
      announcementTitle: link.title,
      timezone: 'UTC+8'
    }));
    
  } catch (error) {
    console.error(`Failed to parse announcement page ${link.url}:`, error);
    throw error;
  }
}

/**
 * Function to parse assessment table (injected into page)
 */
function parseAssessmentTable() {
  try {
    // Look for assessment table
    const tables = document.querySelectorAll('table');
    
    for (const table of tables) {
      const headers = Array.from(table.querySelectorAll('th, td')).map(cell => 
        cell.textContent?.trim().toLowerCase()
      );
      
      // Check if this looks like an assessment table
      if (headers.some(h => h.includes('токен') || h.includes('token')) &&
          headers.some(h => h.includes('время') || h.includes('time') || h.includes('начал') || h.includes('start')) &&
          headers.some(h => h.includes('оконч') || h.includes('end'))) {
        
        return parseTableData(table);
      }
    }
    
    // Fallback: try to parse from paragraphs
    return parseFallbackData();
    
  } catch (error) {
    console.error('Failed to parse assessment table:', error);
    return { entries: [], parsedFrom: 'error', error: error.message };
  }
}

/**
 * Parse data from table
 */
function parseTableData(table) {
  const entries = [];
  const rows = table.querySelectorAll('tbody tr, tr');
  
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td, th'));
    if (cells.length < 2) continue;
    
    try {
      const tokensText = cells[0]?.textContent?.trim() || '';
      const startText = cells[1]?.textContent?.trim() || '';
      const endText = cells[2]?.textContent?.trim() || '';
      
      // Parse tokens
      const tokens = tokensText.split(/[,\n]/)
        .map(token => token.trim())
        .filter(token => /^[A-Z0-9._-]{2,15}$/.test(token));
      
      // Parse dates
      const startDate = parseDate(startText);
      const endDate = endText ? parseDate(endText) : null;
      
      // Create entries for each token
      for (const token of tokens) {
        if (token && startDate) {
          entries.push({
            token,
            startDateIsoUtc: startDate.iso,
            endDateIsoUtc: endDate?.iso || null,
            startLocal: startDate.local,
            endLocal: endDate?.local || null,
            status: calculateStatus(startDate.iso, endDate?.iso),
            daysInAssessment: calculateDaysInAssessment(startDate.iso, endDate?.iso),
            daysRemaining: calculateDaysRemaining(endDate?.iso),
            parsedFrom: 'table'
          });
        }
      }
    } catch (error) {
      console.error('Error parsing row:', error);
    }
  }
  
  return { entries, parsedFrom: 'table' };
}

/**
 * Parse data from paragraphs (fallback)
 */
function parseFallbackData() {
  const entries = [];
  const paragraphs = document.querySelectorAll('p, div');
  
  for (const paragraph of paragraphs) {
    const text = paragraph.textContent || '';
    
    // Look for patterns like "TOKEN added to assessment zone from DATE"
    const patterns = [
      /([A-Z0-9._-]{2,15})\s+(?:добавлен|added).*?(?:с|from)\s+([^,\n]+)/gi,
      /([A-Z0-9._-]{2,15})\s+(?:включен|included).*?(?:с|from)\s+([^,\n]+)/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const token = match[1];
        const dateText = match[2];
        
        try {
          const startDate = parseDate(dateText);
          if (startDate) {
            entries.push({
              token,
              startDateIsoUtc: startDate.iso,
              endDateIsoUtc: null,
              startLocal: startDate.local,
              endLocal: null,
              status: calculateStatus(startDate.iso, null),
              daysInAssessment: calculateDaysInAssessment(startDate.iso, null),
              daysRemaining: null,
              parsedFrom: 'fallback'
            });
          }
        } catch (error) {
          console.error('Error parsing fallback data:', error);
        }
      }
    }
  }
  
  return { entries, parsedFrom: 'fallback' };
}

/**
 * Parse date from text (RU/EN, UTC+8)
 */
function parseDate(dateText) {
  if (!dateText) return null;
  
  try {
    // Clean the text
    const cleanText = dateText.trim().replace(/[^\w\s.,:]/g, ' ');
    
    // Try to parse as ISO date first
    const isoMatch = cleanText.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      const date = new Date(isoMatch[1] + 'T00:00:00+08:00');
      return {
        iso: date.toISOString(),
        local: convertToLocal(date)
      };
    }
    
    // Parse Russian dates
    const ruDate = parseRussianDate(cleanText);
    if (ruDate) return ruDate;
    
    // Parse English dates
    const enDate = parseEnglishDate(cleanText);
    if (enDate) return enDate;
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Parse Russian date format
 */
function parseRussianDate(text) {
  const months = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
    'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
    'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
  };
  
  const pattern = /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i;
  const match = text.match(pattern);
  
  if (match) {
    const day = parseInt(match[1]);
    const month = months[match[2].toLowerCase()];
    const year = parseInt(match[3]);
    
    const date = new Date(year, month, day, 0, 0, 0);
    // Convert from UTC+8 to UTC
    date.setHours(date.getHours() - 8);
    
    return {
      iso: date.toISOString(),
      local: convertToLocal(date)
    };
  }
  
  return null;
}

/**
 * Parse English date format
 */
function parseEnglishDate(text) {
  try {
    // Try standard date parsing
    const date = new Date(text);
    if (!isNaN(date.getTime())) {
      // Assume UTC+8 and convert to UTC
      date.setHours(date.getHours() - 8);
      
      return {
        iso: date.toISOString(),
        local: convertToLocal(date)
      };
    }
  } catch (error) {
    console.error('Error parsing English date:', error);
  }
  
  return null;
}

/**
 * Convert UTC date to Europe/Rome timezone
 */
function convertToLocal(utcDate) {
  try {
    return new Date(utcDate.getTime()).toLocaleString('en-US', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error converting to local time:', error);
    return utcDate.toISOString();
  }
}

/**
 * Calculate status based on dates
 */
function calculateStatus(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  
  if (endDate) {
    const end = new Date(endDate);
    if (end < now) return 'Completed';
    if (start > now) return 'Pending';
    return 'Active';
  } else {
    if (start > now) return 'Pending';
    return 'Active';
  }
}

/**
 * Calculate days in assessment
 */
function calculateDaysInAssessment(startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days remaining
 */
function calculateDaysRemaining(endDate) {
  if (!endDate) return null;
  
  const end = new Date(endDate);
  const now = new Date();
  
  return Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get stored data
 */
async function getStoredData() {
  try {
    const result = await chrome.storage.local.get(CONFIG.storageKey);
    return result[CONFIG.storageKey] || { entries: [], historyByToken: {} };
  } catch (error) {
    console.error('Failed to get stored data:', error);
    return { entries: [], historyByToken: {} };
  }
}

/**
 * Update stored data
 */
async function updateStoredData(newEntries) {
  try {
    const currentData = await getStoredData();
    
    // Add new entries
    currentData.entries.push(...newEntries);
    
    // Update history by token
    for (const entry of newEntries) {
      if (!currentData.historyByToken[entry.token]) {
        currentData.historyByToken[entry.token] = [];
      }
      currentData.historyByToken[entry.token].push({
        startDate: entry.startDateIsoUtc,
        endDate: entry.endDateIsoUtc,
        announcementUrl: entry.announcementUrl,
        announcementTitle: entry.announcementTitle
      });
    }
    
    // Store updated data
    await chrome.storage.local.set({
      [CONFIG.storageKey]: currentData
    });
    
    console.log(`Updated storage with ${newEntries.length} new entries`);
  } catch (error) {
    console.error('Failed to update stored data:', error);
    throw error;
  }
}

/**
 * Get watcher status
 */
async function getWatcherStatus() {
  return {
    isRunning,
    lastCheckTime,
    checkInterval: CONFIG.checkInterval
  };
}

/**
 * Notify UI about updates
 */
function notifyUI(message) {
  try {
    // Use the bridge publish functions if available
    if (typeof publishToTerminal === 'function') {
      publishToTerminal(message);
    } else {
      // Fallback to old method
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url.includes('localhost') || tab.url.includes('127.0.0.1')) {
            chrome.tabs.sendMessage(tab.id, message).catch(() => {
              // Ignore errors for tabs that don't have our content script
            });
          }
        });
      });
    }
  } catch (error) {
    console.error('Failed to notify UI:', error);
  }
}

// Initialize when service worker starts
initAnnouncementsWatcher().catch(console.error);
