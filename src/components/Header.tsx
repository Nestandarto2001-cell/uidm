import React from 'react';
import { ConnectionIndicator } from './ConnectionIndicator';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

export const Header: React.FC = () => {
  const { extState, obFresh, apiState, isStale } = useConnectionStatus();

  return (
    <header className="bg-slate-800/60 border-b border-slate-600/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-200">
          MEXC Trading Terminal
        </h1>
        <ConnectionIndicator
          extState={extState}
          obFresh={obFresh}
          apiState={apiState}
          isStale={isStale || false}
        />
      </div>
    </header>
  );
};
