import React from 'react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

/**
 * Reusable PageHeader component with breadcrumbs, title, badge, subtitle, and action buttons.
 */
export default function PageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 ${className}`}
    >
      <div className="flex flex-col gap-1.5">
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="mb-1" />}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="font-body-md text-sm text-on-surface-variant max-w-2xl">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
