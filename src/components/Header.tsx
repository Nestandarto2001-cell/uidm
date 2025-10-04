import React, { useState, useEffect } from 'react';
import { ConnectionIndicator } from './ConnectionIndicator';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import DiagnosticModal from './DiagnosticModal';

export const Header: React.FC = () => {
  const { extState, obFresh, apiState, isStale } = useConnectionStatus();
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  // Слушаем сообщения от расширения
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === 'MEXC_TT' && event.data?.type === 'OPEN_DIAGNOSTIC_MODAL') {
        setIsDiagnosticOpen(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      <header className="bg-black border-b border-gray-800 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            МексоЁБ
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
              className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md transition-colors text-sm font-medium"
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
