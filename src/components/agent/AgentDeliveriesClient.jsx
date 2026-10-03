'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';

export default function AgentDeliveriesClient({ initialDeliveries = [], agentInfo }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  const filteredDeliveries = initialDeliveries.filter((item) => {
    const matchesSearch =
      item.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.recipient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.recipient?.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.destinationFull || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'OUT_FOR_DELIVERY') return item.status !== 'DELIVERED';
    if (statusFilter === 'DELIVERED') return item.status === 'DELIVERED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Delivery Queue
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
            Active dispatch routes and customer drop-offs assigned to {agentInfo?.name} ({agentInfo?.employeeId}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/agent/dashboard">
            <Button variant="secondary" size="md" icon={<Icon name="dashboard" size={18} />}>
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline flex items-center pointer-events-none">
            <Icon name="search" size={18} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, recipient, city..."
            className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl py-2.5 pl-10 pr-4 text-xs font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: `All Shipments (${initialDeliveries.length})` },
            {
              id: 'OUT_FOR_DELIVERY',
              label: `Active (${initialDeliveries.filter((d) => d.status !== 'DELIVERED').length})`,
            },
            {
              id: 'DELIVERED',
              label: `Completed (${initialDeliveries.filter((d) => d.status === 'DELIVERED').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-primary text-on-primary shadow-sm font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-12 text-center bg-white/70">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="inbox" size={24} />
          </div>
          <h3 className="font-headline-md text-base font-bold text-on-surface mb-1">
            No Deliveries Found
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {initialDeliveries.length === 0
              ? 'No shipments are currently assigned to your delivery route.'
              : 'No shipments match the selected search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery, index) => (
            <div
              key={delivery.id}
              className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              {/* Left: Sequence & Info */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary font-mono font-bold text-sm flex items-center justify-center shrink-0 border border-outline-variant/20">
                  #{index + 1}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-extrabold text-primary">
                      {delivery.trackingNumber}
                    </span>
                    <StatusBadge
                      label={delivery.statusLabel || delivery.status}
                      variant={delivery.statusVariant || 'primary'}
                      pulse={delivery.status === 'ASSIGNED' || delivery.status === 'IN_TRANSIT'}
                    />
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {delivery.packageInfo?.category} • {delivery.packageInfo?.grossWeight}
                    </span>
                  </div>

                  <div className="font-headline-md text-base font-bold text-on-surface">
                    {delivery.recipient?.name}
                  </div>

                  <div className="font-body-md text-xs text-on-surface-variant flex items-center gap-1.5">
                    <Icon name="location_on" size={14} className="text-secondary shrink-0" />
                    <span>{delivery.destinationFull || delivery.recipient?.address}</span>
                  </div>
                </div>
              </div>

              {/* Right: Quick Actions */}
              <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-outline-variant/20 justify-end">
                {delivery.recipient?.phone && (
                  <a
                    href={`tel:${delivery.recipient.phone}`}
                    className="p-2.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors flex items-center"
                    title="Call Customer"
                  >
                    <Icon name="call" size={18} />
                  </a>
                )}

                <Link href={`/agent/deliveries/${delivery.id}`}>
                  <Button variant="secondary" size="sm" icon={<Icon name="chevron_right" size={16} />}>
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
