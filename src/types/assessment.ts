/**
 * Assessment Zone Types
 * Updated types for the improved assessment zone monitor
 */

export interface AssessmentEntry {
  token: string;
  startDateIsoUtc: string;
  endDateIsoUtc?: string;
  startLocal: string;
  endLocal?: string;
  status: 'Active' | 'Completed' | 'Pending';
  daysInAssessment: number;
  daysRemaining?: number;
  announcementUrl: string;
  announcementTitle: string;
  timezone: 'UTC+8';
  parsedFrom: 'table' | 'fallback';
  lastUpdated: string;
  isNew?: boolean;
}

export interface AssessmentHistory {
  startDate: string;
  endDate?: string;
  announcementUrl: string;
  announcementTitle: string;
}

export interface AssessmentData {
  entries: AssessmentEntry[];
  historyByToken: Record<string, AssessmentHistory[]>;
  lastCheckTime?: string;
  lastError?: string;
}

export interface AssessmentFilters {
  status: 'All' | 'Active' | 'Completed' | 'Pending';
  searchToken: string;
  startDateFrom: string;
  startDateTo: string;
  endsSoon: boolean;
  timezone: 'UTC+8' | 'Local';
}

export interface AssessmentStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
}

export interface AssessmentWatcherStatus {
  isRunning: boolean;
  lastCheckTime?: string;
  checkInterval: number;
  lastError?: string;
}

export interface AssessmentUpdateMessage {
  type: 'ASSESS_UPDATE' | 'ASSESS_ERROR' | 'ASSESS_STATUS';
  payload: any;
}
