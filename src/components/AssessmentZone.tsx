/**
 * Assessment Zone Component
 * Main component for the Assessment Zone tab
 */

import React, { useEffect, useState } from 'react';
import AssessmentTable from './AssessmentTable';
import AssessmentStatus from './AssessmentStatus';
// import ToastContainer from './ToastContainer'; // Removed for optimization
import { useAssessment } from '../hooks/useAssessment';
// import { useToast } from '../hooks/useToast'; // Removed for optimization
import AssessmentBridge from '../bridge';

function AssessmentZone() {
  const {
    entries,
    isLoading,
    lastUpdated,
    error,
    refresh,
    watcherStatus,
    stats
  } = useAssessment();

  const [timezone, setTimezone] = useState<'UTC+8' | 'Local'>('Local');

  // const { toasts, showToast, removeToast } = useToast(); // Removed for optimization
  
  // Простая заглушка для showToast
  const showToast = (options: any) => {
    console.log('Toast:', options);
  };

  // Listen for assessment updates to show notifications
  useEffect(() => {
    const unsubscribeUpdate = AssessmentBridge.onUpdate((payload) => {
      if (payload.newEntries) {
        payload.newEntries.forEach((entry: any) => {
          showToast({
            type: 'info',
            title: 'New Assessment',
            message: `${entry.token} from ${new Date(entry.startDateIsoUtc).toLocaleDateString()}`,
            duration: 5000
          });
        });
      }
      
      if (payload.completedEntries) {
        payload.completedEntries.forEach((entry: any) => {
          showToast({
            type: 'success',
            title: 'Assessment Completed',
            message: `${entry.token} completed on ${new Date(entry.endDateIsoUtc!).toLocaleDateString()}`,
            duration: 5000
          });
        });
      }
    });

    return unsubscribeUpdate;
  }, [showToast]);

  const handleToggleWatcher = async () => {
    try {
      // Toggle watcher via bridge
      if (watcherStatus.isRunning) {
        await AssessmentBridge.stop();
        showToast({
          type: 'info',
          title: 'Watcher Status',
          message: 'Watcher stopped',
          duration: 3000
        });
      } else {
        await AssessmentBridge.start();
        showToast({
          type: 'info',
          title: 'Watcher Status',
          message: 'Watcher started',
          duration: 3000
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to toggle watcher',
        duration: 5000
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Container */}
      {/* <ToastContainer toasts={toasts} onRemoveToast={removeToast} /> */} {/* Removed for optimization */}

      {/* Status Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Assessment Zone Monitor
            </h1>
            <AssessmentStatus
              isRunning={watcherStatus.isRunning}
              lastCheck={watcherStatus.lastCheckTime}
              lastError={watcherStatus.lastError}
              onToggle={handleToggleWatcher}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timezone Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Timezone:</span>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value as 'UTC+8' | 'Local')}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="Local">Europe/Rome</option>
                <option value="UTC+8">UTC+8</option>
              </select>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">
                Error: {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Table */}
      <AssessmentTable
        entries={entries}
        onRefresh={refresh}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        timezone={timezone}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Entries</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Assessments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentZone;
