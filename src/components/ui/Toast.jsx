'use client';

import React, { useEffect } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Reusable Toast notification banner component.
 */
export default function Toast({
  message,
  type = 'success', // 'success' | 'error' | 'info' | 'warning'
  isVisible,
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeConfig = {
    success: {
      bg: 'bg-tertiary-container/15 border-tertiary/30 text-tertiary',
      icon: 'check_circle',
    },
    error: {
      bg: 'bg-error-container/30 border-error/30 text-error',
      icon: 'error',
    },
    warning: {
      bg: 'bg-secondary-container/20 border-secondary/30 text-secondary',
      icon: 'warning',
    },
    info: {
      bg: 'bg-primary/10 border-primary/20 text-primary',
      icon: 'info',
    },
  };

  const current = typeConfig[type] || typeConfig.info;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm w-full">
      <div
        className={`glass-panel border rounded-xl p-4 shadow-xl flex items-center justify-between gap-3 ${current.bg}`}
      >
        <div className="flex items-center gap-3">
          <Icon name={current.icon} size={20} />
          <span className="font-label-md text-sm font-semibold">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss toast"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
