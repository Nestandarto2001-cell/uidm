import React, { useState, useEffect } from 'react';
import { TooltipButton } from './Tooltip';

interface OrderFormProps {
  onOrder: (side: 'buy' | 'sell', type: 'limit' | 'market', price: number, amount: number) => void;
  bestBid: number;
  bestAsk: number;
  balance: number;
  isApiConfigured: boolean;
}

export const OrderForm: React.FC<OrderFormProps> = ({ onOrder, bestBid, bestAsk, balance, isApiConfigured }) => {
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');

  const formatPrice = (price: number) => price.toFixed(4);
  const formatAmount = (amount: number) => amount.toFixed(6);

  const handlePriceClick = (clickedPrice: number) => {
    setPrice(formatPrice(clickedPrice));
  };

  const handlePercentageClick = (percentage: number) => {
    if (orderType === 'market') {
      const maxAmount = balance / bestAsk; // For buy orders
      setAmount(formatAmount(maxAmount * (percentage / 100)));
    } else {
      const maxAmount = balance / parseFloat(price || '0');
      setAmount(formatAmount(maxAmount * (percentage / 100)));
    }
  };

  const handleBuyLimit = () => {
    const priceValue = parseFloat(price);
    const amountValue = parseFloat(amount);
    if (priceValue > 0 && amountValue > 0) {
      onOrder('buy', 'limit', priceValue, amountValue);
    }
  };

  const handleSellLimit = () => {
    const priceValue = parseFloat(price);
    const amountValue = parseFloat(amount);
    if (priceValue > 0 && amountValue > 0) {
      onOrder('sell', 'limit', priceValue, amountValue);
    }
  };

  const handleBuyMarket = () => {
    const amountValue = parseFloat(amount);
    if (amountValue > 0) {
      onOrder('buy', 'market', bestAsk, amountValue);
    }
  };

  const handleSellMarket = () => {
    const amountValue = parseFloat(amount);
    if (amountValue > 0) {
      onOrder('sell', 'market', bestBid, amountValue);
    }
  };

  const totalValue = parseFloat(price) * parseFloat(amount) || 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Place Order</h3>
      
      {/* Order Type Toggle */}
      <div className="flex mb-4">
        <TooltipButton
          tooltip={
            <div>
              <div className="font-semibold text-blue-400 mb-1">Лимитный ордер</div>
              <div className="space-y-1">
                <div>• Указываете конкретную цену</div>
                <div>• Ордер исполняется только по указанной цене</div>
                <div>• Более низкие комиссии</div>
                <div>• Может не исполниться, если цена не достигнет</div>
              </div>
            </div>
          }
          onClick={() => setOrderType('limit')}
          className={`px-4 py-2 rounded-l transition-colors ${orderType === 'limit' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Limit
        </TooltipButton>
        <TooltipButton
          tooltip={
            <div>
              <div className="font-semibold text-blue-400 mb-1">Рыночный ордер</div>
              <div className="space-y-1">
                <div>• Исполняется немедленно по рыночной цене</div>
                <div>• Гарантированное исполнение</div>
                <div>• Более высокие комиссии</div>
                <div>• Цена может отличаться от ожидаемой</div>
              </div>
            </div>
          }
          onClick={() => setOrderType('market')}
          className={`px-4 py-2 rounded-r transition-colors ${orderType === 'market' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Market
        </TooltipButton>
      </div>

      {/* Price Input (only for limit orders) */}
      {orderType === 'limit' && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Price (USDT)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.0000"
            step="0.0001"
            className="input-field w-full"
          />
          <div className="flex gap-2 mt-2">
            <TooltipButton
              tooltip="Установить цену покупки (лучшая цена bid)"
              onClick={() => handlePriceClick(bestBid)}
              className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white transition-colors"
            >
              Bid: {formatPrice(bestBid)}
            </TooltipButton>
            <TooltipButton
              tooltip="Установить цену продажи (лучшая цена ask)"
              onClick={() => handlePriceClick(bestAsk)}
              className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white transition-colors"
            >
              Ask: {formatPrice(bestAsk)}
            </TooltipButton>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Amount (YNE)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.000000"
          step="0.000001"
          className="input-field w-full"
        />
        <div className="flex gap-2 mt-2">
          <TooltipButton
            tooltip="Использовать 25% от доступного баланса"
            onClick={() => handlePercentageClick(25)}
            className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white transition-colors"
          >
            25%
          </TooltipButton>
          <TooltipButton
            tooltip="Использовать 50% от доступного баланса"
            onClick={() => handlePercentageClick(50)}
            className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white transition-colors"
          >
            50%
          </TooltipButton>
          <TooltipButton
            tooltip="Использовать 100% от доступного баланса"
            onClick={() => handlePercentageClick(100)}
            className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white transition-colors"
          >
            100%
          </TooltipButton>
        </div>
      </div>

      {/* Order Preview */}
      {amount && (
        <div className="mb-4 p-3 bg-gray-700 rounded text-sm">
          <div className="text-gray-400">Order Preview:</div>
          {orderType === 'limit' ? (
            <div>Buy {amount} YNE for {totalValue.toFixed(4)} USDT</div>
          ) : (
            <div>Buy {amount} YNE at market price</div>
          )}
        </div>
      )}

      {/* Order Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {!isApiConfigured ? (
          <div className="col-span-2 p-3 bg-red-900/20 border border-red-600/30 rounded-md text-center text-red-400 text-sm">
            Configure API credentials to place orders
          </div>
        ) : orderType === 'limit' ? (
          <>
            <TooltipButton
              tooltip={
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Лимитный ордер на покупку</div>
                  <div className="space-y-1">
                    <div>• Покупка по указанной цене</div>
                    <div>• Исполняется только если цена достигнет</div>
                    <div>• Более низкая комиссия</div>
                  </div>
                </div>
              }
              onClick={handleBuyLimit}
              className="order-button buy-button"
            >
              Buy Limit
            </TooltipButton>
            <TooltipButton
              tooltip={
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Лимитный ордер на продажу</div>
                  <div className="space-y-1">
                    <div>• Продажа по указанной цене</div>
                    <div>• Исполняется только если цена достигнет</div>
                    <div>• Более низкая комиссия</div>
                  </div>
                </div>
              }
              onClick={handleSellLimit}
              className="order-button sell-button"
            >
              Sell Limit
            </TooltipButton>
          </>
        ) : (
          <>
            <TooltipButton
              tooltip={
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Рыночный ордер на покупку</div>
                  <div className="space-y-1">
                    <div>• Немедленная покупка по рыночной цене</div>
                    <div>• Гарантированное исполнение</div>
                    <div>• Выше комиссия</div>
                  </div>
                </div>
              }
              onClick={handleBuyMarket}
              className="order-button buy-button"
            >
              Buy Market
            </TooltipButton>
            <TooltipButton
              tooltip={
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Рыночный ордер на продажу</div>
                  <div className="space-y-1">
                    <div>• Немедленная продажа по рыночной цене</div>
                    <div>• Гарантированное исполнение</div>
                    <div>• Выше комиссия</div>
                  </div>
                </div>
              }
              onClick={handleSellMarket}
              className="order-button sell-button"
            >
              Sell Market
            </TooltipButton>
          </>
        )}
      </div>

      {/* Balance and order preview */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Balance:</span>
          <span className="font-mono">{balance.toFixed(4)} USDT</span>
        </div>
        {orderType === 'limit' && price && amount && (
          <div className="flex justify-between text-sm text-gray-300">
            <span>Est. Cost:</span>
            <span className="font-mono">{(parseFloat(price) * parseFloat(amount)).toFixed(4)} USDT</span>
          </div>
        )}
        {orderType === 'market' && amount && (
          <div className="flex justify-between text-sm text-yellow-400">
            <span>Order Type:</span>
            <span className="font-mono">Market Order</span>
          </div>
        )}
      </div>
    </div>
  );
};
