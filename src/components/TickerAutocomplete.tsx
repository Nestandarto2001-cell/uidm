import React, { useState, useEffect, useRef } from 'react';

interface TickerOption {
  symbol: string;
  name: string;
  category: string;
}

interface TickerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TickerAutocomplete: React.FC<TickerAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Введите тикер (например: BTCUSDT)",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<TickerOption[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Популярные тикеры с категориями
  const popularTickers: TickerOption[] = [
    // Основные криптовалюты
    { symbol: "BTC_USDT", name: "Bitcoin", category: "Основные" },
    { symbol: "ETH_USDT", name: "Ethereum", category: "Основные" },
    { symbol: "BNB_USDT", name: "Binance Coin", category: "Основные" },
    { symbol: "ADA_USDT", name: "Cardano", category: "Основные" },
    { symbol: "SOL_USDT", name: "Solana", category: "Основные" },
    { symbol: "DOT_USDT", name: "Polkadot", category: "Основные" },
    { symbol: "MATIC_USDT", name: "Polygon", category: "Основные" },
    { symbol: "AVAX_USDT", name: "Avalanche", category: "Основные" },
    { symbol: "LINK_USDT", name: "Chainlink", category: "Основные" },
    { symbol: "UNI_USDT", name: "Uniswap", category: "Основные" },
    
    // Мемкоины
    { symbol: "DOGE_USDT", name: "Dogecoin", category: "Мемкоины" },
    { symbol: "SHIB_USDT", name: "Shiba Inu", category: "Мемкоины" },
    { symbol: "PEPE_USDT", name: "Pepe", category: "Мемкоины" },
    { symbol: "FLOKI_USDT", name: "Floki", category: "Мемкоины" },
    
    // DeFi
    { symbol: "AAVE_USDT", name: "Aave", category: "DeFi" },
    { symbol: "COMP_USDT", name: "Compound", category: "DeFi" },
    { symbol: "MKR_USDT", name: "Maker", category: "DeFi" },
    { symbol: "SUSHI_USDT", name: "SushiSwap", category: "DeFi" },
    
    // AI и новые технологии
    { symbol: "AI_USDT", name: "AI Token", category: "AI" },
    { symbol: "RNDR_USDT", name: "Render", category: "AI" },
    { symbol: "FET_USDT", name: "Fetch.ai", category: "AI" },
    
    // Примеры из оценочной зоны (могут быть недоступны через API)
    { symbol: "DEGENFI_USDT", name: "DegenFi", category: "Оценочная зона" },
    { symbol: "NEWCOIN_USDT", name: "NewCoin", category: "Оценочная зона" },
    { symbol: "TEST_USDT", name: "Test Token", category: "Оценочная зона" },
  ];

  // Фильтрация опций при вводе
  useEffect(() => {
    if (!value || value.length < 1) {
      setFilteredOptions([]);
      return;
    }

    const filtered = popularTickers.filter(option =>
      option.symbol.toLowerCase().includes(value.toLowerCase()) ||
      option.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredOptions(filtered);
    setHighlightedIndex(-1);
  }, [value]);

  // Обработка ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.toUpperCase();
    
    // Автоматически добавляем _USDT если пользователь не указал валюту
    if (inputValue && !inputValue.includes('_') && !inputValue.includes('/')) {
      inputValue = inputValue + '_USDT';
    }
    
    onChange(inputValue);
    setIsOpen(true);
  };

  // Выбор опции
  const handleOptionSelect = (option: TickerOption) => {
    onChange(option.symbol);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Обработка клавиатуры
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Клик вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Группировка опций по категориям
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, TickerOption[]>);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {Object.entries(groupedOptions).map(([category, options]) => (
            <div key={category}>
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-700 border-b border-gray-600">
                {category}
              </div>
              {options.map((option, index) => {
                const globalIndex = filteredOptions.indexOf(option);
                return (
                  <div
                    key={option.symbol}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-700 ${
                      highlightedIndex === globalIndex ? 'bg-gray-700' : ''
                    }`}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(globalIndex)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-white font-medium">{option.symbol}</div>
                        <div className="text-sm text-gray-400">{option.name}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      
      {isOpen && filteredOptions.length === 0 && value.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-3"
        >
          <div className="text-gray-400 text-sm">
            Тикер "{value}" не найден. Попробуйте другой.
          </div>
        </div>
      )}
    </div>
  );
};
