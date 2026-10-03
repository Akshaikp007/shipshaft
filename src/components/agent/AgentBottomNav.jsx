'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';

export default function AgentBottomNav() {
  const pathname = usePathname();

  const items = [
    { label: 'Dashboard', href: '/agent/dashboard', icon: 'dashboard' },
    { label: 'Deliveries', href: '/agent/deliveries', icon: 'local_shipping' },
    { label: 'Scan', href: '/agent/scan', icon: 'qr_code_scanner', highlight: true },
    { label: 'Settings', href: '/agent/settings', icon: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 md:hidden flex items-center justify-around py-2 px-3 shadow-lg">
      {items.map((item) => {
        const isActive =
          item.href === '/agent/dashboard'
            ? pathname === '/agent/dashboard'
            : pathname.startsWith(item.href);

        if (item.highlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center border-4 border-surface">
                <Icon name={item.icon} size={22} />
              </div>
              <span className="text-[10px] font-semibold text-primary mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            <Icon name={item.icon} size={20} />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
