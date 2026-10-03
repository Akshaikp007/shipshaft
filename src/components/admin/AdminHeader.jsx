'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { handleLogout } from '@/lib/auth/client';

export default function AdminHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
    router.refresh();
  };

  const adminLinks = [
    { label: 'Command Center', href: '/admin', icon: 'dashboard' },
    { label: 'Shipments', href: '/admin/shipments', icon: 'local_shipping' },
    { label: 'Agents & Fleet', href: '/admin/agents', icon: 'group' },
    { label: 'Logistics Hubs', href: '/admin/branches', icon: 'warehouse' },
    { label: 'User Roles', href: '/admin/users', icon: 'manage_accounts' },
    { label: 'Reports & Analytics', href: '/admin/reports', icon: 'insights' },
    { label: 'System Alerts', href: '/admin/notifications', icon: 'notifications' },
    { label: 'Settings', href: '/admin/settings', icon: 'tune' },
  ];

  return (
    <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm md:hidden flex flex-col">
      <div className="flex justify-between items-center h-16 px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <Icon name="deployed_code" size={18} />
          </div>
          <div className="font-headline-md text-base font-bold text-primary">
            ShipShaft <span className="text-xs text-on-surface-variant font-normal">Admin</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/notifications"
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors relative"
          >
            <Icon name="notifications" size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="bg-surface border-t border-outline-variant/20 p-4 flex flex-col gap-1 shadow-xl animate-fade-in">
          {adminLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              <Icon name={item.icon} size={18} className="text-primary" />
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="pt-2 mt-2 border-t border-outline-variant/20 flex flex-col gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-on-surface-variant"
            >
              <Icon name="swap_horiz" size={18} />
              <span>Customer View</span>
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-error cursor-pointer w-full text-left"
            >
              <Icon name="logout" size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
