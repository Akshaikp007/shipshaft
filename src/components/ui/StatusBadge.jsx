import React from 'react';

/**
 * Reusable StatusBadge component matching Stitch visual language.
 * Displays a badge pill with an optional glowing pulse ring indicator.
 */
export default function StatusBadge({ label, variant = 'primary', pulse = false, className = '' }) {
  const variantStyles = {
    primary: 'bg-surface-container-high text-primary border-primary/20',
    success: 'bg-tertiary-container/10 text-tertiary border-tertiary/20',
    warning: 'bg-secondary-container/20 text-secondary border-secondary/30',
    info: 'bg-primary/10 text-primary border-primary/20',
    error: 'bg-error-container/40 text-error border-error/30',
    neutral: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
  };

  const dotStyles = {
    primary: 'bg-primary',
    success: 'bg-tertiary',
    warning: 'bg-secondary',
    info: 'bg-primary',
    error: 'bg-error',
    neutral: 'bg-outline',
  };

  const selectedVariant = variantStyles[variant] || variantStyles.primary;
  const selectedDot = dotStyles[variant] || dotStyles.primary;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-label-md font-semibold ${selectedVariant} ${className}`}>
      {pulse ? (
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedDot}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${selectedDot}`}></span>
        </span>
      ) : (
        <span className={`w-2 h-2 rounded-full ${selectedDot}`}></span>
      )}
      <span>{label}</span>
    </div>
  );
}
