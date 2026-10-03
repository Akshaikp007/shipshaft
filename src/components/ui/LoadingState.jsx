import React from 'react';

/**
 * Reusable LoadingState component with spinner and skeleton animation.
 */
export default function LoadingState({
  message = 'Loading operational telemetry...',
  type = 'spinner', // 'spinner' | 'skeleton'
  rows = 3,
  className = '',
}) {
  if (type === 'skeleton') {
    return (
      <div className={`space-y-4 animate-pulse w-full ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-surface-container-high/60 rounded-xl border border-outline-variant/20 w-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`min-h-[200px] flex flex-col items-center justify-center gap-3 p-8 text-center ${className}`}
    >
      <div className="relative">
        <span className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin inline-block"></span>
      </div>
      <p className="font-label-md text-xs font-medium text-on-surface-variant tracking-wide">
        {message}
      </p>
    </div>
  );
}
