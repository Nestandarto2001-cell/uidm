/**
 * Tab Navigation Component
 * Provides tab-based navigation for the application
 */

import React from 'react';

export type TabType = 'trading' | 'assessment' | 'connection';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'trading' as TabType, label: 'Trading Terminal', icon: '📈' },
    { id: 'assessment' as TabType, label: 'Assessment Zone', icon: '🔍' },
    { id: 'connection' as TabType, label: 'Подключение', icon: '🔌' }
  ];

  return (
    <div className="bg-slate-800/60 border-b border-slate-600/50">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;
