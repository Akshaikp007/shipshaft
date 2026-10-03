'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ShipmentCard from '@/components/ui/ShipmentCard';
import Toast from '@/components/ui/Toast';

export default function AgentDashboardClient({ initialAgent, initialDeliveries = [], initialMetrics }) {
  const [agent, setAgent] = useState(initialAgent);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  const activeDeliveries = deliveries.filter((s) => s.status !== 'DELIVERED');
  const nextStop = activeDeliveries.length > 0 ? activeDeliveries[0] : null;

  const filteredDeliveries = deliveries.filter((s) => {
    if (selectedFilter === 'PENDING') return s.status !== 'DELIVERED';
    if (selectedFilter === 'COMPLETED') return s.status === 'DELIVERED';
    return true;
  });

  const pendingCount = deliveries.filter((s) => s.status !== 'DELIVERED').length;
  const completedCount = deliveries.filter((s) => s.status === 'DELIVERED').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/10 text-tertiary font-label-md text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span>Shift Active • {agent.availability || 'Available'}</span>
          </div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Good morning, {agent.name}
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant flex items-center gap-2 mt-1">
            <Icon name="location_on" size={16} className="text-secondary" />
            <span>{agent.branchName} • ID: {agent.employeeId}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/agent/deliveries">
            <Button variant="primary" size="md" icon={<Icon name="list" size={18} />}>
              Full Queue ({deliveries.length})
            </Button>
          </Link>
          <Link href="/agent/settings">
            <Button variant="secondary" size="md" icon={<Icon name="tune" size={18} />}>
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-xs uppercase font-semibold text-on-surface-variant">
              Total Assigned
            </span>
            <Icon name="local_shipping" size={20} className="text-primary" />
          </div>
          <div>
            <div className="font-headline-md text-2xl font-black text-on-surface">
              {deliveries.length}
            </div>
            <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">
              <strong className="text-tertiary font-semibold">{completedCount} delivered</strong> • {pendingCount} active
            </div>
          </div>
        </div>

        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-xs uppercase font-semibold text-on-surface-variant">
              Active Queue
            </span>
            <Icon name="pending_actions" size={20} className="text-secondary" />
          </div>
          <div>
            <div className="font-headline-md text-2xl font-black text-secondary">
              {pendingCount}
            </div>
            <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">
              {pendingCount > 0 ? 'Assigned for delivery' : 'All clear'}
            </div>
          </div>
        </div>

        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-xs uppercase font-semibold text-on-surface-variant">
              On-Time Rating
            </span>
            <Icon name="verified" size={20} className="text-tertiary" />
          </div>
          <div>
            <div className="font-headline-md text-2xl font-black text-tertiary">
              99.2%
            </div>
            <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">
              Certified Driver (Top Tier)
            </div>
          </div>
        </div>

        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-xs uppercase font-semibold text-on-surface-variant">
              Fleet Vehicle
            </span>
            <Icon name="electric_car" size={20} className="text-primary" />
          </div>
          <div>
            <div className="font-label-md text-sm font-bold text-on-surface truncate">
              {agent.vehicleType || 'Delivery Van'}
            </div>
            <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              {agent.vehicleNumber || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Next Priority Stop Highlight Card */}
      {nextStop ? (
        <div className="relative glass-panel border border-primary/30 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-surface to-primary/5 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider">
                  Next Priority Stop
                </span>
                <span className="font-mono text-xs font-bold text-on-surface-variant">
                  #{nextStop.trackingNumber}
                </span>
                <StatusBadge label={nextStop.statusLabel || nextStop.status} variant="warning" pulse />
              </div>

              <div>
                <h3 className="font-headline-md text-xl md:text-2xl font-black text-on-surface">
                  {nextStop.recipient?.name || nextStop.receiverName}
                </h3>
                <p className="font-body-md text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                  <Icon name="location_on" size={18} className="text-primary shrink-0" />
                  <span>{nextStop.destinationFull || nextStop.receiverAddress}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-outline-variant/20 text-xs">
                <div>
                  <span className="text-on-surface-variant block">Recipient Contact</span>
                  <span className="font-semibold text-on-surface">{nextStop.recipient?.phone || nextStop.receiverPhone}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Package Weight</span>
                  <span className="font-semibold text-on-surface">{nextStop.packageInfo?.grossWeight || `${nextStop.weight} kg`}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Payment Mode</span>
                  <span className="font-semibold text-tertiary">Prepaid Online</span>
                </div>
              </div>
            </div>

            {/* Next Stop Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link href={`/agent/deliveries/${nextStop.id}`}>
                <Button variant="primary" size="md" className="w-full" icon={<Icon name="info" size={18} />}>
                  Stop Details
                </Button>
              </Link>
              {nextStop.recipient?.phone && (
                <a
                  href={`tel:${nextStop.recipient.phone}`}
                  className="w-full text-center py-2 text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1.5"
                >
                  <Icon name="call" size={16} />
                  <span>Call Customer</span>
                </a>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-8 text-center bg-white/70">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="check_circle" size={24} />
          </div>
          <h3 className="font-headline-md text-lg font-bold text-on-surface mb-1">
            No Pending Deliveries
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            You currently have no active deliveries in your dispatch queue. Newly assigned shipments will appear here automatically.
          </p>
        </div>
      )}

      {/* Deliveries Queue List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-headline-md text-lg font-bold text-on-surface">
              Assigned Shipments Queue
            </h2>
            <p className="font-body-md text-xs text-on-surface-variant">
              Manage status transitions and view consignment details.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-outline-variant/25">
            {[
              { id: 'ALL', label: `All Deliveries (${deliveries.length})` },
              { id: 'PENDING', label: `Active (${pendingCount})` },
              { id: 'COMPLETED', label: `Delivered (${completedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedFilter === f.id
                    ? 'bg-surface text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shipment Cards Grid */}
        {filteredDeliveries.length === 0 ? (
          <div className="glass-panel border border-outline-variant/30 rounded-2xl p-8 text-center text-on-surface-variant text-xs">
            {deliveries.length === 0 ? 'No deliveries assigned.' : 'No shipments found in this category.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeliveries.map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                role="agent"
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
