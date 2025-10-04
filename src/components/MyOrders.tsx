import React, { useState } from 'react';
import { Order } from '../types';

interface MyOrdersProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => void;
}

export const MyOrders: React.FC<MyOrdersProps> = ({ orders, onCancelOrder }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'filled' | 'cancelled'>('all');

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const formatPrice = (price: number) => price.toFixed(4);
  const formatAmount = (amount: number) => amount.toFixed(6);
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'filled': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'buy' ? 'text-bid' : 'text-ask';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">My Orders</h3>
        <div className="flex gap-2">
          {(['all', 'pending', 'filled', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded text-xs ${
                filter === status ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No {filter === 'all' ? '' : filter} orders
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-700 rounded p-3 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 text-sm">
                  <span className={`font-medium ${getSideColor(order.side)}`}>
                    {order.side.toUpperCase()} {order.type.toUpperCase()}
                  </span>
                  <span className="text-gray-300">
                    {formatAmount(order.amount)} YNE
                  </span>
                  {order.type === 'limit' && (
                    <span className="text-gray-300">
                      @ {formatPrice(order.price)}
                    </span>
                  )}
                  <span className={`text-xs ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatTime(order.timestamp)}
                </div>
              </div>
              
              {order.status === 'pending' && (
                <button
                  onClick={() => onCancelOrder(order.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="Cancel order"
                >
                  ✖
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
