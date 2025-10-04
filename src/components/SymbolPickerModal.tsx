import React, { useState, useMemo } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { GROUPS, GROUP_SYMBOLS, ALL_SYMBOLS, type GroupId } from '../config/symbolGroups';

interface SymbolPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  currentSymbol: string;
}

export const SymbolPickerModal: React.FC<SymbolPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentSymbol
}) => {
  const [group, setGroup] = useState<GroupId>('favorites');
  const [searchTerm, setSearchTerm] = useState('');
  const { list: favorites, toggle, has } = useFavorites();

  const getGroupSymbols = (groupId: GroupId): string[] => {
    switch (groupId) {
      case 'favorites':
        return favorites;
      case 'all':
        return ALL_SYMBOLS;
      default:
        return GROUP_SYMBOLS[groupId] || [];
    }
  };

  const filteredSymbols = useMemo(() => {
    const groupSymbols = getGroupSymbols(group);
    
    if (!searchTerm) return groupSymbols;
    
    return groupSymbols.filter(symbol => 
      symbol.toUpperCase().startsWith(searchTerm.toUpperCase())
    );
  }, [group, searchTerm, favorites]);

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    onClose();
  };

  const handleStarClick = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(symbol);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800/60 border border-slate-600/50 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600/50">
          <h2 className="text-lg font-semibold text-slate-200">Выберите тикер</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="p-4 border-b border-slate-600/50">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {GROUPS.map((groupItem) => (
              <button
                key={groupItem.id}
                onClick={() => setGroup(groupItem.id)}
                className={`px-3 py-1 text-xs whitespace-nowrap transition-colors ${
                  group === groupItem.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {groupItem.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-600/50">
          <input
            type="text"
            placeholder="Поиск по тикеру..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-500"
          />
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">
              {GROUPS.find(g => g.id === group)?.label || 'Тикеры'}
            </h3>
            <div className="space-y-1">
              {filteredSymbols.length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-4">
                  {group === 'favorites' ? 'Нет избранных тикеров' : 'Тикеры не найдены'}
                </div>
              ) : (
                filteredSymbols.map((symbol) => (
                  <div
                    key={symbol}
                    onClick={() => handleSelect(symbol)}
                    className={`flex items-center justify-between p-2 hover:bg-slate-700/50 cursor-pointer ${
                      currentSymbol === symbol ? 'bg-slate-700' : ''
                    }`}
                  >
                    <span className="text-slate-200">{symbol}</span>
                    <button
                      onClick={(e) => handleStarClick(symbol, e)}
                      className="text-slate-400 hover:text-yellow-400"
                    >
                      {has(symbol) ? '★' : '☆'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
