import React from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

/**
 * Reusable EmptyState illustration/message component.
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'No records found',
  description = 'There are currently no items matching your criteria.',
  actionLabel,
  onAction,
  actionHref,
  className = '',
}) {
  return (
    <div
      className={`glass-panel border border-outline-variant/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-6 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-container-high/60 flex items-center justify-center text-primary mb-4 border border-outline-variant/20 shadow-inner">
        <Icon name={icon} size={32} />
      </div>
      <h3 className="font-headline-md text-base font-bold text-on-surface mb-1">
        {title}
      </h3>
      <p className="font-body-md text-xs text-on-surface-variant max-w-xs mb-6">
        {description}
      </p>

      {actionLabel && (
        <>
          {actionHref ? (
            <a href={actionHref}>
              <Button size="sm" variant="primary">
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button size="sm" variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
