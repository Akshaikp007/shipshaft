'use client';

import React, { useEffect } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Reusable accessible modal dialog with backdrop blur, keyboard ESC close, and customizable sizes.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidth} glass-panel bg-white/95 rounded-2xl shadow-2xl border border-white/60 overflow-hidden z-10 animate-scale-up ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-outline-variant/20 bg-surface-container-low/30">
          <div>
            {title && (
              <h3 className="font-headline-md text-lg font-bold text-on-surface">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
            aria-label="Close dialog"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 px-6 border-t border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
