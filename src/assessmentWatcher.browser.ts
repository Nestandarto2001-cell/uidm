/**
 * Assessment Zone Watcher for Browser
 * Browser-compatible version that uses API calls instead of Node.js modules
 */

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

// Event emitter simulation for browser
class BrowserEventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  off(event: string, listener: Function) {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
}

// Event emitter for notifications
export const assessmentEmitter = new BrowserEventEmitter();

// Global state
let isRunning = false;
let lastData: AssessmentData = { entries: [], lastCheck: new Date().toISOString() };

/**
 * Parse token and date from announcement text
 */
export function parseAnnouncementText(text: string): { token: string; startDate: string } | null {
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
export function parseCompletionText(text: string): string | null {
  // Pattern: выведен из оценочной зоны ... YYYY-MM-DD
  const pattern = /выведен\s+из\s+оценочной\s+зоны.*?(\d{4}-\d{2}-\d{2})/i;
  const match = text.match(pattern);
  
  return match ? match[1] : null;
}

/**
 * Calculate duration in days
 */
export function calculateDuration(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get current assessment data (browser version - uses API)
 */
export async function getAssessmentData(): Promise<AssessmentData> {
  try {
    // In a real implementation, this would make an API call
    // For now, return mock data
    return {
      entries: [
        {
          token: 'DOGE',
          startDate: '2024-01-15',
          url: 'https://www.mexc.com/ru-RU/support/articles/123456',
          status: 'active',
          duration: 15,
          isNew: false,
          lastUpdated: '2024-01-30T10:00:00Z'
        },
        {
          token: 'SHIB',
          startDate: '2024-01-20',
          endDate: '2024-02-05',
          url: 'https://www.mexc.com/ru-RU/support/articles/123457',
          status: 'completed',
          duration: 16,
          isNew: false,
          lastUpdated: '2024-02-05T15:30:00Z'
        },
        {
          token: 'PEPE',
          startDate: '2024-02-01',
          url: 'https://www.mexc.com/ru-RU/support/articles/123458',
          status: 'active',
          duration: 3,
          isNew: true,
          lastUpdated: '2024-02-04T09:15:00Z'
        }
      ],
      lastCheck: '2024-02-04T09:15:00Z'
    };
  } catch (error) {
    console.error('Failed to load assessment data:', error);
    return { entries: [], lastCheck: new Date().toISOString() };
  }
}

/**
 * Force refresh assessment data (browser version)
 */
export async function refreshAssessmentData(): Promise<void> {
  try {
    // In a real implementation, this would trigger the backend to check for new data
    console.log('Refreshing assessment data...');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Emit refresh event
    assessmentEmitter.emit('dataRefreshed');
  } catch (error) {
    console.error('Failed to refresh assessment data:', error);
    assessmentEmitter.emit('assessmentError', error);
  }
}

/**
 * Start monitoring the assessment zone (browser version)
 */
export async function startAssessmentWatcher(): Promise<void> {
  if (isRunning) {
    console.log('Assessment watcher is already running');
    return;
  }

  console.log('Starting assessment zone watcher (browser mode)...');
  isRunning = true;

  // Load initial data
  try {
    lastData = await getAssessmentData();
    assessmentEmitter.emit('dataLoaded', lastData);
  } catch (error) {
    console.error('Failed to load initial assessment data:', error);
    assessmentEmitter.emit('assessmentError', error);
  }

  console.log('Assessment watcher started (browser mode)');
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
  console.log('Assessment watcher stopped');
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

// Auto-start if this module is imported (only in browser)
if (typeof window !== 'undefined') {
  startAssessmentWatcher().catch(console.error);
}
