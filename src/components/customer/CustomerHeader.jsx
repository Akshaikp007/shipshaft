'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function CustomerHeader({ user }) {
  const displayName = user?.name || 'Customer';

  return (
    <header className="md:hidden glass-panel fixed top-0 w-full z-50 flex justify-between items-center px-edge-margin-mobile h-16 shadow-lg border-b border-glass-border">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
          <Icon name="deployed_code" size={18} />
        </div>
        <span className="font-headline-md text-lg text-primary font-bold tracking-tight">
          ShipShaft
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="relative w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
          title="Notifications"
        >
          <Icon name="notifications" size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        </Link>
        <Link
          href="/settings"
          className="w-9 h-9 rounded-full overflow-hidden border border-white/40 bg-primary/10 text-primary flex items-center justify-center font-bold text-xs"
          title="Settings"
        >
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{displayName.charAt(0).toUpperCase()}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
