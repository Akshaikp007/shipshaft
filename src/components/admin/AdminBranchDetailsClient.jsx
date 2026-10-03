'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ShipmentCard from '@/components/ui/ShipmentCard';

export default function AdminBranchDetailsClient({
  branch,
  stationedAgents = [],
  hubShipments = [],
}) {
  const breadcrumbs = [
    { label: 'Command Center', href: '/admin', icon: 'dashboard' },
    { label: 'Logistics Hubs', href: '/admin/branches', icon: 'warehouse' },
    { label: branch.name },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Breadcrumbs and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs items={breadcrumbs} />

        <div className="flex items-center gap-2.5">
          <Link href="/admin/branches">
            <Button variant="secondary" size="sm" icon={<Icon name="arrow_back" size={16} />}>
              Back to Hubs
            </Button>
          </Link>
          <a href={`tel:${branch.phone}`}>
            <Button variant="outline" size="sm" icon={<Icon name="call" size={16} />}>
              Call Control Desk
            </Button>
          </a>
        </div>
      </div>

      {/* Main Hub Banner */}
      <div className="glass-panel border border-primary/25 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-white via-surface-container-low to-primary/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="font-mono text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">
              {branch.code}
            </span>
            <StatusBadge
              label={branch.statusLabel || 'Operational'}
              variant={branch.statusVariant || 'success'}
              pulse={branch.status === 'ACTIVE'}
            />
          </div>

          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            {branch.name}
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant flex items-center gap-2 mt-1">
            <Icon name="location_on" size={16} className="text-secondary shrink-0" />
            <span>
              {branch.address ? `${branch.address}, ` : ''}
              {branch.city}, {branch.state}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-on-surface-variant block">Operations Manager</span>
            <span className="font-bold text-on-surface text-sm">{branch.manager}</span>
            <span className="text-on-surface-variant font-mono text-[11px] block">{branch.phone}</span>
          </div>
        </div>
      </div>

      {/* Hub Throughput Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 text-center">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block mb-1">
            Active Consignments
          </span>
          <span className="font-headline-md text-2xl font-black text-primary">
            {branch.activeShipments} pkgs
          </span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 text-center">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block mb-1">
            Stationed Agents
          </span>
          <span className="font-headline-md text-2xl font-black text-tertiary">
            {branch.totalAgents} couriers
          </span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 text-center">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block mb-1">
            Daily Throughput
          </span>
          <span className="font-headline-md text-2xl font-black text-secondary">
            {branch.dailyThroughput}
          </span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 text-center">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block mb-1">
            Capacity Load
          </span>
          <span className="font-headline-md text-2xl font-black text-on-surface">
            {branch.capacityUsage}
          </span>
        </div>
      </div>

      {/* Two Column: Stationed Drivers & Hub Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stationed Fleet Drivers */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
            <Icon name="badge" size={20} className="text-primary" />
            <span>Stationed Fleet Units ({stationedAgents.length})</span>
          </h2>

          <div className="space-y-3">
            {stationedAgents.length === 0 ? (
              <div className="glass-panel border border-outline-variant/30 rounded-2xl p-8 text-center text-on-surface-variant text-xs font-medium">
                No agents stationed at this hub.
              </div>
            ) : (
              stationedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                      {(agent.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-on-surface block">{agent.name}</span>
                      <span className="text-[11px] text-on-surface-variant">{agent.vehicleType}</span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/agents/${agent.id}`}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Profile
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Hub Consignments */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
            <Icon name="local_shipping" size={20} className="text-primary" />
            <span>Active Terminal Consignments ({hubShipments.length})</span>
          </h2>

          <div className="space-y-4">
            {hubShipments.length === 0 ? (
              <div className="glass-panel border border-outline-variant/30 rounded-2xl p-8 text-center text-on-surface-variant text-xs font-medium">
                No shipments routed through this hub.
              </div>
            ) : (
              hubShipments.map((s) => (
                <ShipmentCard key={s.id} shipment={s} role="admin" />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
