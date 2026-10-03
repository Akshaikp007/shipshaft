import React from 'react';

/**
 * Reusable Card component for Stitch glassmorphic containers.
 */
export default function Card({
  children,
  className = '',
  glass = true,
  hoverable = false,
  ...props
}) {
  const baseClasses = glass
    ? 'glass-panel border border-white/30 rounded-xl shadow-sm'
    : 'bg-surface-container rounded-xl border border-outline-variant/20 shadow-sm';

  const hoverClasses = hoverable
    ? 'hover:shadow-md hover:border-primary/40 transition-all duration-200'
    : '';

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
