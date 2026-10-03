import React from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Reusable ShipmentTimeline component reflecting the Stitch timeline standard.
 * Renders vertical steps with icons, status styling, timestamps, and locations.
 */
export default function ShipmentTimeline({
  steps = [],
  className = '',
}) {
  if (!steps.length) return null;

  return (
    <div className={`flex flex-col gap-0 ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} className="relative flex items-start gap-4 pb-8 group last:pb-0">
            {/* Vertical connector line */}
            {!isLast && (
              <div
                className={`absolute left-4 top-8 -bottom-0 w-0.5 transition-colors ${
                  isCompleted
                    ? 'bg-primary'
                    : isCurrent
                    ? 'bg-gradient-to-b from-primary to-outline-variant/40'
                    : 'bg-outline-variant/30'
                }`}
              />
            )}

            {/* Node Icon Indicator */}
            <div className="relative z-10 shrink-0">
              {isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                  <Icon name="check" size={16} />
                </div>
              ) : isCurrent ? (
                <div className="relative w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg ring-4 ring-primary/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-container-high/60 border border-outline-variant/40 text-outline flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-outline-variant" />
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span
                  className={`font-label-md text-sm font-bold ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-on-surface'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {step.step || step.title}
                </span>
                {step.timestamp && (
                  <span className="text-[11px] font-mono text-outline shrink-0">
                    {step.timestamp}
                  </span>
                )}
              </div>

              {step.location && (
                <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                  <Icon name="location_on" size={12} className="text-secondary" />
                  <span>{step.location}</span>
                </div>
              )}

              {step.description && (
                <p className="text-xs text-on-surface-variant/80 mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
