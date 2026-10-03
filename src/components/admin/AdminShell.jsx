'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminShell({ children, adminData }) {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Ambient Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-64 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* Desktop Left Sidebar */}
      <AdminSidebar adminData={adminData} />

      {/* Mobile Top Header */}
      <AdminHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-64 pt-20 md:pt-8 px-4 sm:px-6 md:px-10 pb-16 max-w-container-max mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
