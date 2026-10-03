'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { handleLogout } from '@/lib/auth/client';

export default function AgentSidebar({ agentData }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', href: '/agent/dashboard', icon: 'dashboard' },
    { label: 'Delivery Queue', href: '/agent/deliveries', icon: 'local_shipping' },
    { label: 'QR Scanner', href: '/agent/scan', icon: 'qr_code_scanner' },
    { label: 'Agent Settings', href: '/agent/settings', icon: 'settings' },
  ];

  const isActive = (href) => {
    if (href === '/agent/dashboard') return pathname === '/agent/dashboard';
    if (href === '/agent/deliveries') return pathname.startsWith('/agent/deliveries');
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-container/80 backdrop-blur-2xl border-r border-outline-variant/30 shadow-xl pt-7 pb-6 z-40">
      {/* Brand Header */}
      <div className="px-6 mb-6">
        <Link href="/agent/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-md group-hover:scale-105 transition-transform">
            <Icon name="deployed_code" size={24} />
          </div>
          <div>
            <div className="font-headline-md text-base text-primary font-extrabold tracking-tight">
              ShipShaft
            </div>
            <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
              Agent Terminal
            </div>
          </div>
        </Link>
      </div>

      {/* Agent Profile Capsule */}
      <div className="mx-4 mb-6 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/25 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary">
            {(agentData?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? 'bg-tertiary' : 'bg-outline'
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-label-md text-xs font-bold text-on-surface truncate">
            {agentData?.name || 'Delivery Agent'}
          </p>
          <p className="font-label-sm text-[10px] text-on-surface-variant font-mono">
            ID: #{agentData?.employeeId || 'AGT'} ({agentData?.branchName || 'Hub'})
          </p>
        </div>
      </div>

      {/* Quick Action: Scan QR */}
      <div className="px-4 mb-6">
        <Link
          href="/agent/scan"
          className="btn-premium w-full bg-primary text-on-primary font-label-md text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-primary-container transition-all"
        >
          <Icon name="qr_code_scanner" size={18} />
          <span>Scan Shipment</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-label-md text-xs transition-all ${
                active
                  ? 'bg-surface text-primary font-bold shadow-sm border border-outline-variant/20'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              <Icon
                name={item.icon}
                size={20}
                className={active ? 'text-primary' : 'text-on-surface-variant'}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Area: Duty Status & Logout */}
      <div className="px-4 mt-auto pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`w-full py-2.5 px-3 rounded-xl font-label-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            isOnline
              ? 'bg-error-container/40 text-error hover:bg-error-container/70'
              : 'bg-tertiary-container/30 text-tertiary hover:bg-tertiary-container/50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-error' : 'bg-tertiary'}`} />
          <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center gap-2 px-3 py-2 text-on-surface-variant hover:text-error text-xs font-semibold rounded-lg transition-colors cursor-pointer w-full"
        >
          <Icon name="logout" size={16} />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}
