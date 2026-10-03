import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

/**
 * Reusable Breadcrumbs navigation component.
 */
export default function Breadcrumbs({ items = [], className = '' }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 font-label-md text-xs text-on-surface-variant ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-outline-variant select-none">
                <Icon name="chevron_right" size={14} />
              </span>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                {item.icon && <Icon name={item.icon} size={14} />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                className={`flex items-center gap-1 ${
                  isLast ? 'text-on-surface font-semibold' : ''
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.icon && <Icon name={item.icon} size={14} />}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
