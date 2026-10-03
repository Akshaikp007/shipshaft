'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { handleLogout } from '@/lib/auth/client';

export default function AdminSidebar({ adminData }) {
  const router = useRouter();
  const pathname = usePathname();

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Command Center', href: '/admin', icon: 'dashboard' },
    { label: 'Shipments', href: '/admin/shipments', icon: 'local_shipping' },
    { label: 'Agents & Fleet', href: '/admin/agents', icon: 'group' },
    { label: 'Logistics Hubs', href: '/admin/branches', icon: 'warehouse' },
    { label: 'User Roles', href: '/admin/users', icon: 'manage_accounts' },
    { label: 'Reports & Analytics', href: '/admin/reports', icon: 'insights' },
    { label: 'System Alerts', href: '/admin/notifications', icon: 'notifications' },
    { label: 'Platform Settings', href: '/admin/settings', icon: 'tune' },
  ];

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-container/85 backdrop-blur-2xl border-r border-outline-variant/30 shadow-xl pt-7 pb-6 z-40">
      {/* Brand Header */}
      <div className="px-6 mb-6">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-md group-hover:scale-105 transition-transform">
            <Icon name="deployed_code" size={24} />
          </div>
          <div>
            <div className="font-headline-md text-base text-primary font-extrabold tracking-tight">
              ShipShaft
            </div>
            <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold flex items-center gap-1">
              <span>Admin Console</span>
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            </div>
          </div>
        </Link>
      </div>

      {/* Admin User Profile */}
      <div className="mx-4 mb-4 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/25 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary">
          {(adminData?.name || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-label-md text-xs font-bold text-on-surface truncate">
            {adminData?.name || 'Administrator'}
          </p>
          <p className="font-label-sm text-[10px] text-on-surface-variant font-mono">
            {adminData?.role || 'ADMIN'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-md text-xs transition-all ${
                active
                  ? 'bg-surface text-primary font-bold shadow-sm border border-outline-variant/20'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              <Icon
                name={item.icon}
                size={18}
                className={active ? 'text-primary' : 'text-on-surface-variant'}
              />
              <span className="truncate">{item.label}</span>
              {item.href === '/admin/notifications' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-error" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="px-4 mt-auto pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 text-on-surface-variant hover:text-primary text-xs font-semibold rounded-lg transition-colors"
        >
          <Icon name="swap_horiz" size={16} />
          <span>Switch to Customer View</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2.5 px-3 py-2 text-on-surface-variant hover:text-error text-xs font-semibold rounded-lg transition-colors cursor-pointer w-full text-left"
        >
          <Icon name="logout" size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
