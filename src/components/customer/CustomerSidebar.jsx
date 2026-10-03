'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { handleLogout } from '@/lib/auth/client';

export default function CustomerSidebar({ user }) {
  const router = useRouter();
  const pathname = usePathname();

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Shipments', href: '/shipments', icon: 'local_shipping' },
    { label: 'Book Shipment', href: '/shipments/book', icon: 'add_box' },
    { label: 'Notifications', href: '/notifications', icon: 'notifications' },
    { label: 'Settings', href: '/settings', icon: 'settings' },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/shipments') return pathname === '/shipments';
    return pathname.startsWith(href);
  };

  const displayName = user?.name || 'Customer Account';
  const displayEmail = user?.email || 'Authorized User';

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-container/70 bg-glass-fill backdrop-blur-2xl border-r border-outline-variant/30 shadow-xl pt-8 pb-6 z-40">
      {/* Brand Header */}
      <div className="px-6 mb-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-md group-hover:scale-105 transition-transform">
            <Icon name="deployed_code" size={24} />
          </div>
          <div>
            <div className="font-headline-md text-base text-primary font-extrabold tracking-tight">
              ShipShaft
            </div>
            <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
              Customer Portal
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-label-md text-sm transition-all duration-200 ${
                active
                  ? 'bg-primary text-white shadow-md font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface font-medium'
              }`}
            >
              <Icon
                name={item.icon}
                size={20}
                className={active ? 'text-white' : 'text-on-surface-variant'}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Footer Area */}
      <div className="px-4 mt-auto pt-4 border-t border-outline-variant/20 flex flex-col gap-3">
        {/* Support Link */}
        <a
          href="mailto:support@shipshaft.com"
          className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface text-label-md font-label-md rounded-lg transition-colors"
        >
          <Icon name="help" size={18} />
          <span>Support</span>
        </a>

        {/* Profile Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm overflow-hidden border border-white/50 shrink-0">
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
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="font-label-md text-sm text-on-surface font-semibold truncate">
              {displayName}
            </p>
            <p className="font-label-sm text-[11px] text-on-surface-variant truncate">
              {displayEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            className="text-on-surface-variant hover:text-error p-1 transition-colors cursor-pointer"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
