/**
 * Toast Container Component
 * Manages and displays toast notifications
 */

import React, { useState, useCallback } from 'react';
import Toast, { ToastProps } from './Toast';

export interface ToastData {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast
}) => {
  const handleClose = useCallback((id: string) => {
    onRemoveToast(id);
  }, [onRemoveToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={handleClose}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
