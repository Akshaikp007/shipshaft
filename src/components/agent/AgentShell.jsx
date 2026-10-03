'use client';

import React from 'react';
import AgentSidebar from '@/components/agent/AgentSidebar';
import AgentHeader from '@/components/agent/AgentHeader';
import AgentBottomNav from '@/components/agent/AgentBottomNav';

export default function AgentShell({ children, agentData }) {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Ambient Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-64 w-[600px] h-[600px] bg-tertiary/5 rounded-full blur-[120px]" />
      </div>

      {/* Desktop Left Sidebar */}
      <AgentSidebar agentData={agentData} />

      {/* Mobile Top Header */}
      <AgentHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-64 pt-20 md:pt-8 px-4 sm:px-6 md:px-10 pb-24 md:pb-12 max-w-container-max mx-auto relative z-10">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <AgentBottomNav />
    </div>
  );
}
