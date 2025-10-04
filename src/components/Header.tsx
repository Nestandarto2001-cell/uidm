import React, { useState } from 'react';
import { ConnectionIndicator } from './ConnectionIndicator';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import DiagnosticModal from './DiagnosticModal';

export const Header: React.FC = () => {
  const { extState, obFresh, apiState, isStale } = useConnectionStatus();
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  return (
    <>
      <header className="bg-slate-800/60 border-b border-slate-600/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-200">
            MEXC Trading Terminal
          </h1>
          
          <div className="flex items-center space-x-4">
            <ConnectionIndicator
              extState={extState}
              obFresh={obFresh}
              apiState={apiState}
              isStale={isStale || false}
            />
            
            <button
              onClick={() => setIsDiagnosticOpen(true)}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              title="Диагностика подключения"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Диагностика</span>
            </button>
          </div>
        </div>
      </header>
      
      <DiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </>
  );
};
