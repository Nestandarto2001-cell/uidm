import React from 'react';

interface ConnectionIndicatorProps {
  extState: 'live' | 'degraded' | 'disconnected';
  obFresh: boolean;
  apiState?: 'connected' | 'disconnected';
  isStale?: boolean;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  extState,
  obFresh,
  apiState,
  isStale
}) => {
  const getExtStatusColor = () => {
    switch (extState) {
      case 'live':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getExtStatusText = () => {
    switch (extState) {
      case 'live':
        return 'LIVE';
      case 'degraded':
        return 'DEGRADED';
      case 'disconnected':
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  };

  const getApiStatusColor = () => {
    switch (apiState) {
      case 'connected':
        return 'bg-blue-500';
      case 'disconnected':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* EXT Status */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/60 border border-slate-600/50 text-xs">
        <div className={`w-2 h-2 ${getExtStatusColor()}`}></div>
        <span className="text-slate-200">EXT: {getExtStatusText()}</span>
      </div>

      {/* OrderBook Fresh Status */}
      {(isStale || !obFresh) && (
        <div className="px-2 py-1 bg-red-600/60 border border-red-600/50 text-xs text-white">
          STALE
        </div>
      )}

      {/* API Status */}
      {apiState && (
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/60 border border-slate-600/50 text-xs">
          <div className={`w-2 h-2 ${getApiStatusColor()}`}></div>
          <span className="text-slate-200">API: {apiState.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
};
