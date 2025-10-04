/**
 * Assessment Status Component
 * Shows the status of the assessment zone watcher
 */

import React from 'react';

interface AssessmentStatusProps {
  isRunning: boolean;
  lastCheck?: string;
  lastError?: string;
  onToggle: () => void;
}

const AssessmentStatus: React.FC<AssessmentStatusProps> = ({
  isRunning,
  lastCheck,
  lastError,
  onToggle
}) => {
  const getStatusColor = () => {
    if (lastError) return 'text-red-500';
    if (isRunning) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (lastError) return 'Error';
    if (isRunning) return 'OK';
    return 'Stopped';
  };

  const getStatusIcon = () => {
    if (lastError) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    if (isRunning) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          Assessment watcher: {getStatusText()}
        </span>
      </div>
      
      {lastCheck && (
        <span className="text-xs text-gray-500">
          ({new Date(lastCheck).toLocaleTimeString('ru-RU')})
        </span>
      )}
      
      {lastError && (
        <span className="text-xs text-red-500" title={lastError}>
          Error
        </span>
      )}
      
      <button
        onClick={onToggle}
        className={`px-2 py-1 text-xs rounded ${
          isRunning 
            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
        title={isRunning ? 'Stop watcher' : 'Start watcher'}
      >
        {isRunning ? 'Stop' : 'Start'}
      </button>
    </div>
  );
};

export default AssessmentStatus;
