/**
 * Assessment API endpoints
 * Simulates API calls for assessment data
 */

import { AssessmentData, AssessmentEntry } from '../assessmentWatcher';

// Mock data for development/testing
const mockAssessmentData: AssessmentData = {
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

/**
 * Get assessment data
 */
export async function getAssessmentData(): Promise<AssessmentData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In a real implementation, this would make an HTTP request to the backend
  return mockAssessmentData;
}

/**
 * Refresh assessment data
 */
export async function refreshAssessmentData(): Promise<AssessmentData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, this would trigger the watcher to check for new data
  return mockAssessmentData;
}

/**
 * Get watcher status
 */
export async function getWatcherStatus(): Promise<{
  isRunning: boolean;
  lastCheck?: string;
  lastError?: string;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  return {
    isRunning: true,
    lastCheck: mockAssessmentData.lastCheck,
    lastError: undefined
  };
}

/**
 * Toggle watcher (start/stop)
 */
export async function toggleWatcher(): Promise<{
  isRunning: boolean;
  message: string;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // In a real implementation, this would start/stop the watcher service
  return {
    isRunning: true,
    message: 'Watcher toggled successfully'
  };
}
