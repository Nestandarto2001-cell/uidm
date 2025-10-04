import React, { useState, useEffect } from 'react';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  storageKey?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  children,
  defaultCollapsed = false,
  storageKey,
  status,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : defaultCollapsed;
      } catch {
        return defaultCollapsed;
      }
    }
    return defaultCollapsed;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, storageKey]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-slate-800/60 border border-slate-600/50 ${className}`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">
            {isCollapsed ? '▶' : '▼'}
          </span>
          <span className="text-slate-200 text-sm font-medium">{title}</span>
          {getStatusIcon() && (
            <span className={`text-sm ${getStatusColor()}`}>
              {getStatusIcon()}
            </span>
          )}
        </div>
      </button>
      
      {!isCollapsed && (
        <div className="px-3 py-2 border-t border-slate-600/50">
          {children}
        </div>
      )}
    </div>
  );
};
