import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

/**
 * Reusable NotificationItem component for customer and admin notifications lists.
 */
export default function NotificationItem({
  notification,
  onMarkAsRead,
  className = '',
}) {
  if (!notification) return null;

  const typeConfig = {
    delivery: { icon: 'local_shipping', color: 'text-primary bg-primary/10' },
    payment: { icon: 'receipt_long', color: 'text-tertiary bg-tertiary/10' },
    alert: { icon: 'warning', color: 'text-error bg-error/10' },
    system: { icon: 'dns', color: 'text-secondary bg-secondary/10' },
    info: { icon: 'info', color: 'text-primary bg-primary/10' },
  };

  const config = typeConfig[notification.type] || typeConfig.info;

  return (
    <div
      className={`glass-panel border rounded-2xl p-4 sm:p-5 flex items-start gap-4 transition-all duration-200 ${
        notification.read
          ? 'border-outline-variant/20 bg-white/70 opacity-80'
          : 'border-primary/30 bg-white/95 shadow-sm ring-1 ring-primary/10'
      } ${className}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}
      >
        <Icon name={config.icon} size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4
            className={`font-label-md text-sm truncate ${
              notification.read
                ? 'font-medium text-on-surface'
                : 'font-bold text-on-surface'
            }`}
          >
            {notification.title}
          </h4>
          <span className="text-[11px] font-mono text-outline shrink-0">
            {notification.timestamp || notification.time}
          </span>
        </div>

        <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mb-2">
          {notification.message}
        </p>

        <div className="flex items-center justify-between gap-3 pt-1">
          {notification.link ? (
            <Link
              href={notification.link}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>{notification.linkText || 'View Details'}</span>
              <Icon name="arrow_forward" size={12} />
            </Link>
          ) : (
            <div />
          )}

          {!notification.read && onMarkAsRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="text-[11px] font-semibold text-outline hover:text-primary transition-colors"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
