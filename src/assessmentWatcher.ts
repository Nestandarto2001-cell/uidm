/**
 * Assessment Zone Watcher for MEXC
 * Monitors the assessment zone announcements and tracks token status
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';

// Types
export interface AssessmentEntry {
  token: string;
  startDate: string;
  endDate?: string;
  url: string;
  status: 'active' | 'completed';
  duration?: number;
  isNew?: boolean;
  lastUpdated: string;
}

export interface AssessmentData {
  entries: AssessmentEntry[];
  lastCheck: string;
  lastError?: string;
}

// Configuration
const CONFIG = {
  baseUrl: 'https://www.mexc.com/ru-RU/announcements/search',
  query: 'оценочную+зону',
  limit: 50,
  page: 1,
  checkInterval: parseInt(process.env.ASSESS_WATCH_INTERVAL_MINUTES || '10') * 60 * 1000, // 10 minutes default
  dataFile: path.join(process.cwd(), 'data', 'assessmentData.json'),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Event emitter for notifications
export const assessmentEmitter = new EventEmitter();

// Global state
let isRunning = false;
let checkInterval: NodeJS.Timeout | null = null;
let lastData: AssessmentData = { entries: [], lastCheck: new Date().toISOString() };

/**
 * Load assessment data from JSON file
 */
async function loadAssessmentData(): Promise<AssessmentData> {
  try {
    const data = await fs.readFile(CONFIG.dataFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No existing assessment data found, starting fresh');
    return { entries: [], lastCheck: new Date().toISOString() };
  }
}

/**
 * Save assessment data to JSON file
 */
async function saveAssessmentData(data: AssessmentData): Promise<void> {
  try {
    await fs.mkdir(path.dirname(CONFIG.dataFile), { recursive: true });
    await fs.writeFile(CONFIG.dataFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save assessment data:', error);
    throw error;
  }
}

/**
 * Parse token and date from announcement text
 */
function parseAnnouncementText(text: string): { token: string; startDate: string } | null {
  // Pattern: TOKEN_NAME ... с YYYY-MM-DD
  const pattern = /([A-Z0-9_]+).*с\s+(\d{4}-\d{2}-\d{2})/i;
  const match = text.match(pattern);
  
  if (match) {
    return {
      token: match[1].toUpperCase(),
      startDate: match[2]
    };
  }
  
  return null;
}

/**
 * Parse assessment completion from announcement text
 */
function parseCompletionText(text: string): string | null {
  // Pattern: выведен из оценочной зоны ... YYYY-MM-DD
  const pattern = /выведен\s+из\s+оценочной\s+зоны.*?(\d{4}-\d{2}-\d{2})/i;
  const match = text.match(pattern);
  
  return match ? match[1] : null;
}

/**
 * Fetch announcements using HTTP request
 */
async function fetchAnnouncements(): Promise<string> {
  const url = `${CONFIG.baseUrl}?query=${CONFIG.query}&limit=${CONFIG.limit}&page=${CONFIG.page}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': CONFIG.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Fetch announcements using Puppeteer (fallback)
 */
async function fetchAnnouncementsWithPuppeteer(): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(CONFIG.userAgent);
    
    const url = `${CONFIG.baseUrl}?query=${CONFIG.query}&limit=${CONFIG.limit}&page=${CONFIG.page}`;
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for announcements container to appear
    await page.waitForSelector('.announcement-item, .announcement-list, [class*="announcement"]', { timeout: 10000 });
    
    const content = await page.content();
    return content;
  } finally {
    await browser.close();
  }
}

/**
 * Parse announcements from HTML content
 */
function parseAnnouncements(html: string): Array<{ title: string; url: string; date: string }> {
  const $ = cheerio.load(html);
  const announcements: Array<{ title: string; url: string; date: string }> = [];

  // Try different selectors for announcement items
  const selectors = [
    '.announcement-item a',
    '.announcement-list a',
    '[class*="announcement"] a',
    'a[href*="announcement"]',
    '.list-item a',
    '.news-item a'
  ];

  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const $el = $(element);
      const title = $el.text().trim();
      const href = $el.attr('href');
      
      if (title && href && title.toLowerCase().includes('оценочн')) {
        const url = href.startsWith('http') ? href : `https://www.mexc.com${href}`;
        const date = $el.closest('[class*="item"], [class*="announcement"]').find('[class*="date"], [class*="time"]').text().trim();
        
        announcements.push({ title, url, date });
      }
    });

    if (announcements.length > 0) break;
  }

  return announcements;
}

/**
 * Fetch and parse announcement details
 */
async function fetchAnnouncementDetails(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch announcement details from ${url}:`, error);
    return '';
  }
}

/**
 * Calculate duration in days
 */
function calculateDuration(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check for new assessment entries
 */
async function checkAssessmentZone(): Promise<void> {
  try {
    console.log('Checking assessment zone...');
    
    // Load existing data
    lastData = await loadAssessmentData();
    const existingEntries = new Map(lastData.entries.map(entry => [entry.url, entry]));
    
    let html: string;
    try {
      // Try HTTP request first
      html = await fetchAnnouncements();
    } catch (error) {
      console.log('HTTP request failed, trying Puppeteer...');
      html = await fetchAnnouncementsWithPuppeteer();
    }

    // Parse announcements
    const announcements = parseAnnouncements(html);
    console.log(`Found ${announcements.length} announcements`);

    const newEntries: AssessmentEntry[] = [];
    const updatedEntries: AssessmentEntry[] = [];

    for (const announcement of announcements) {
      // Skip if already processed
      if (existingEntries.has(announcement.url)) {
        continue;
      }

      // Parse token and start date from title
      const parsed = parseAnnouncementText(announcement.title);
      if (!parsed) {
        console.log(`Could not parse token/date from: ${announcement.title}`);
        continue;
      }

      // Fetch announcement details to check for completion
      const detailsHtml = await fetchAnnouncementDetails(announcement.url);
      const endDate = detailsHtml ? parseCompletionText(detailsHtml) : undefined;
      
      const entry: AssessmentEntry = {
        token: parsed.token,
        startDate: parsed.startDate,
        endDate: endDate || undefined,
        url: announcement.url,
        status: endDate ? 'completed' : 'active',
        duration: calculateDuration(parsed.startDate, endDate || undefined),
        isNew: true,
        lastUpdated: new Date().toISOString()
      };

      newEntries.push(entry);
      console.log(`New assessment entry: ${entry.token} (${entry.startDate})`);
    }

    // Check for status updates in existing entries
    for (const existingEntry of lastData.entries) {
      if (existingEntry.status === 'active') {
        const detailsHtml = await fetchAnnouncementDetails(existingEntry.url);
        const endDate = detailsHtml ? parseCompletionText(detailsHtml) : undefined;
        
        if (endDate && endDate !== existingEntry.endDate) {
          const updatedEntry: AssessmentEntry = {
            ...existingEntry,
            endDate,
            status: 'completed',
            duration: calculateDuration(existingEntry.startDate, endDate),
            isNew: false,
            lastUpdated: new Date().toISOString()
          };
          
          updatedEntries.push(updatedEntry);
          console.log(`Assessment completed: ${updatedEntry.token} on ${endDate}`);
        }
      }
    }

    // Update data
    const allEntries = [
      ...lastData.entries.map(entry => ({ ...entry, isNew: false })),
      ...newEntries,
      ...updatedEntries
    ];

    lastData = {
      entries: allEntries,
      lastCheck: new Date().toISOString(),
      lastError: undefined
    };

    await saveAssessmentData(lastData);

    // Emit events for new entries and completions
    for (const entry of newEntries) {
      assessmentEmitter.emit('newAssessmentEntry', entry);
    }

    for (const entry of updatedEntries) {
      assessmentEmitter.emit('assessmentCompleted', entry);
    }

    console.log(`Assessment check completed. New entries: ${newEntries.length}, Updated: ${updatedEntries.length}`);

  } catch (error) {
    console.error('Assessment zone check failed:', error);
    
    lastData.lastError = error instanceof Error ? error.message : String(error);
    await saveAssessmentData(lastData);
    
    assessmentEmitter.emit('assessmentError', error);
  }
}

/**
 * Start monitoring the assessment zone
 */
export async function startAssessmentWatcher(): Promise<void> {
  if (isRunning) {
    console.log('Assessment watcher is already running');
    return;
  }

  console.log('Starting assessment zone watcher...');
  isRunning = true;

  // Initial check
  await checkAssessmentZone();

  // Schedule periodic checks
  checkInterval = setInterval(checkAssessmentZone, CONFIG.checkInterval);
  
  console.log(`Assessment watcher started. Check interval: ${CONFIG.checkInterval / 1000 / 60} minutes`);
}

/**
 * Stop monitoring the assessment zone
 */
export function stopAssessmentWatcher(): void {
  if (!isRunning) {
    console.log('Assessment watcher is not running');
    return;
  }

  console.log('Stopping assessment zone watcher...');
  isRunning = false;

  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  console.log('Assessment watcher stopped');
}

/**
 * Get current assessment data
 */
export async function getAssessmentData(): Promise<AssessmentData> {
  return await loadAssessmentData();
}

/**
 * Force refresh assessment data
 */
export async function refreshAssessmentData(): Promise<void> {
  await checkAssessmentZone();
}

/**
 * Get watcher status
 */
export function getWatcherStatus(): { isRunning: boolean; lastCheck?: string; lastError?: string } {
  return {
    isRunning,
    lastCheck: lastData.lastCheck,
    lastError: lastData.lastError
  };
}

// Auto-start if this module is imported
if (process.env.NODE_ENV !== 'test') {
  startAssessmentWatcher().catch(console.error);
}
