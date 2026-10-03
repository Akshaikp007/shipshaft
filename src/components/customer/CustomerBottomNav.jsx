'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';

export default function CustomerBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Shipments', href: '/shipments', icon: 'local_shipping' },
    { label: 'Book', href: '/shipments/book', icon: 'add_box' },
    { label: 'Alerts', href: '/notifications', icon: 'notifications' },
    { label: 'Settings', href: '/settings', icon: 'settings' },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/shipments') return pathname === '/shipments';
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 w-full glass-panel border-t border-white/20 z-50 pb-safe shadow-lg">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${
                active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div className="relative">
                <Icon name={item.icon} size={22} />
                {item.href === '/notifications' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary"></span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
