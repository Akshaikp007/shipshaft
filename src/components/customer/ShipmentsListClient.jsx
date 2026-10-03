'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function ShipmentsListClient({ shipments = [] }) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!shipments || shipments.length === 0) {
    return (
      <EmptyState
        icon="local_shipping"
        title="No Shipments Yet"
        description="You have not booked any shipments yet. Get started by creating your first precision logistics shipment."
        actionLabel="Book a Shipment"
        actionHref="/shipments/book"
        className="my-10"
      />
    );
  }

  const filteredShipments = shipments.filter((item) => {
    // Tab filter
    if (activeTab === 'Active' && item.status === 'DELIVERED') {
      return false;
    }
    if (activeTab === 'Delivered' && item.status !== 'DELIVERED') {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q) || item.trackingNumber.toLowerCase().includes(q);
      const matchRecipient = item.recipient?.name?.toLowerCase().includes(q);
      const matchDest = item.destination?.toLowerCase().includes(q);
      return matchId || matchRecipient || matchDest;
    }

    return true;
  });

  return (
    <div className="space-y-stack-md">
      {/* Filters & Search Toolbar */}
      <div className="glass-panel border border-white/40 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-stack-md shadow-sm">
        {/* Tabs */}
        <div className="flex bg-surface-container-highest p-1 rounded-xl w-full md:w-auto">
          {['All', 'Active', 'Delivered'].map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-label-md text-label-md transition-all ${
                  isSelected
                    ? 'bg-surface text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Icon
            name="search"
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracking ID, recipient..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface/50 text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Shipments Container */}
      <div className="glass-panel border border-white/40 rounded-xl overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/60">
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Tracking ID
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Recipient
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Destination
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Date
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Status
                </th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant font-body-md">
                    No shipments found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-container-highest/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <Link
                        href={`/shipments/${item.id}`}
                        className="font-title-lg text-title-lg text-primary font-mono text-sm font-bold hover:underline"
                      >
                        #{item.trackingNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-label-md text-label-md text-on-surface font-semibold">
                        {item.recipient?.name}
                      </div>
                      {item.recipient?.attention && (
                        <div className="font-body-md text-xs text-on-surface-variant">
                          {item.recipient.attention}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">
                      {item.destination}
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant text-sm">
                      {item.date}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge
                        label={item.statusLabel}
                        variant={item.statusVariant}
                        pulse={item.status === 'IN_TRANSIT'}
                      />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/shipments/${item.id}`}
                        className="text-primary hover:text-primary-container font-label-md text-label-md transition-colors inline-flex items-center justify-end gap-1 font-semibold"
                      >
                        <span>View Details</span>
                        <Icon
                          name="chevron_right"
                          size={16}
                          className="transform group-hover:translate-x-1 transition-transform"
                        />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-outline-variant/15">
          {filteredShipments.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-body-md">
              No shipments found matching your filters.
            </div>
          ) : (
            filteredShipments.map((item) => (
              <div key={item.id} className="p-5 hover:bg-surface-container-highest/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-title-lg text-title-lg text-primary font-mono text-sm font-bold">
                    #{item.trackingNumber}
                  </span>
                  <StatusBadge
                    label={item.statusLabel}
                    variant={item.statusVariant}
                    pulse={item.status === 'IN_TRANSIT'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                      Recipient
                    </p>
                    <p className="font-label-md text-label-md text-on-surface font-medium">
                      {item.recipient?.name}
                    </p>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                      Destination
                    </p>
                    <p className="font-label-md text-label-md text-on-surface font-medium">
                      {item.destination}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-outline-variant/15 pt-3">
                  <p className="font-body-md text-xs text-on-surface-variant">{item.date}</p>
                  <Link
                    href={`/shipments/${item.id}`}
                    className="text-primary font-label-md text-label-md font-bold flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <Icon name="chevron_right" size={16} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        <div className="bg-surface-container-low/70 border-t border-outline-variant/20 px-6 py-4 flex justify-between items-center">
          <span className="font-body-md text-body-md text-on-surface-variant text-sm">
            Showing 1-{filteredShipments.length} of {shipments.length} shipments
          </span>
          <div className="flex gap-2">
            <button
              disabled
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest disabled:opacity-40 transition-colors"
              title="Previous Page"
            >
              <Icon name="chevron_left" size={20} />
            </button>
            <button
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              title="Next Page"
            >
              <Icon name="chevron_right" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
