'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function AgentHeader() {
  return (
    <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm md:hidden flex justify-between items-center h-16 px-4">
      <Link href="/agent/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
          <Icon name="deployed_code" size={18} />
        </div>
        <div className="font-headline-md text-base font-bold text-primary">
          ShipShaft <span className="text-xs text-on-surface-variant font-normal">Agent</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/agent/scan"
          className="p-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
          title="Scan QR"
        >
          <Icon name="qr_code_scanner" size={20} />
        </Link>
        <Link
          href="/notifications"
          className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
          title="Alerts"
        >
          <Icon name="notifications" size={20} />
        </Link>
      </div>
    </header>
  );
}
