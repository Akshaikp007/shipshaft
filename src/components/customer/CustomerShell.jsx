'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import CustomerSidebar from './CustomerSidebar';
import CustomerHeader from './CustomerHeader';
import CustomerBottomNav from './CustomerBottomNav';

export default function CustomerShell({ children, user }) {
  const pathname = usePathname();

  // Determine if current screen is a dedicated sub-page (Payment, Invoice, Shipment Details)
  // Stitch specifications explicitly suppress persistent navigation on these transactional/document pages
  const isDedicatedSubpage =
    pathname.startsWith('/payments/') ||
    pathname.startsWith('/invoices/') ||
    (pathname.startsWith('/shipments/') && pathname !== '/shipments/book');

  if (isDedicatedSubpage) {
    return (
      <div className="min-h-screen bg-background text-on-surface relative overflow-x-hidden">
        {/* Ambient Background Mesh */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-tertiary/5 rounded-full mix-blend-multiply filter blur-[120px] opacity-60"></div>
        </div>

        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Ambient Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-64 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Desktop Left Sidebar */}
      <CustomerSidebar user={user} />

      {/* Mobile Top Header */}
      <CustomerHeader user={user} />

      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-64 pt-20 md:pt-10 px-edge-margin-mobile md:px-edge-margin-desktop pb-24 md:pb-12 max-w-container-max mx-auto relative z-10">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <CustomerBottomNav />
    </div>
  );
}
