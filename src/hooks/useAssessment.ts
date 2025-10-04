/**
 * Assessment Hook
 * Manages assessment zone data and watcher status
 */

import { useState, useEffect, useCallback } from 'react';
import { AssessmentEntry, AssessmentData, AssessmentWatcherStatus } from '../types/assessment';
import AssessmentBridge from '../bridge';

interface UseAssessmentReturn {
  entries: AssessmentEntry[];
  isLoading: boolean;
  lastUpdated?: string;
  error?: string;
  refresh: () => Promise<void>;
  watcherStatus: AssessmentWatcherStatus;
  stats: {
    total: number;
    active: number;
    completed: number;
    pending: number;
  };
}

export const useAssessment = (): UseAssessmentReturn => {
  const [entries, setEntries] = useState<AssessmentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>();
  const [error, setError] = useState<string>();
  const [watcherStatus, setWatcherStatus] = useState<AssessmentWatcherStatus>({
    isRunning: false,
    checkInterval: 10,
    lastCheckTime: undefined,
    lastError: undefined
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0
  });

  const loadAssessmentData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Get status from bridge
      try {
        const statusResponse = await AssessmentBridge.getStatus();
        setWatcherStatus(statusResponse);
      } catch (error) {
        console.error('Failed to get watcher status:', error);
      }

      // For now, we'll get data from bridge events
      // The actual data loading will be handled by bridge events
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assessment data';
      setError(errorMessage);
      console.error('Failed to load assessment data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      // Trigger assessment check via bridge
      await AssessmentBridge.refresh();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh assessment data';
      setError(errorMessage);
      console.error('Failed to refresh assessment data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load initial data
    loadAssessmentData();

    // Listen for assessment updates
    const unsubscribeUpdate = AssessmentBridge.onUpdate((payload) => {
      if (payload.entries) {
        setEntries(payload.entries);
        setLastUpdated(payload.lastCheckTime);
        
        // Calculate stats
        const newStats = {
          total: payload.entries.length,
          active: payload.entries.filter((e: any) => e.status === 'Active').length,
          completed: payload.entries.filter((e: any) => e.status === 'Completed').length,
          pending: payload.entries.filter((e: any) => e.status === 'Pending').length
        };
        setStats(newStats);
      }
    });

    // Listen for status changes
    const unsubscribeStatus = AssessmentBridge.onStatusChange((status) => {
      setWatcherStatus(status);
    });

    // Listen for errors
    const unsubscribeError = AssessmentBridge.onError((error) => {
      setError(error);
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeStatus();
      unsubscribeError();
    };
  }, [loadAssessmentData]);

  return {
    entries,
    isLoading,
    lastUpdated,
    error,
    refresh,
    watcherStatus,
    stats
  };
};
