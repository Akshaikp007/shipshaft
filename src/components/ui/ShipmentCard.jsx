import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';

/**
 * Reusable ShipmentCard component for cards list, agent queue, or dashboard widgets.
 */
export default function ShipmentCard({
  shipment,
  href,
  role = 'customer', // 'customer' | 'agent' | 'admin'
  className = '',
}) {
  if (!shipment) return null;

  const defaultHref =
    href ||
    (role === 'agent'
      ? `/agent/deliveries/${shipment.id}`
      : role === 'admin'
      ? `/admin/shipments/${shipment.id}`
      : `/shipments/${shipment.id}`);

  return (
    <div
      className={`glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col justify-between gap-4 group ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high/60 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <Icon name="local_shipping" size={18} />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-primary block">
              {shipment.trackingNumber || shipment.id}
            </span>
            <span className="text-[11px] text-on-surface-variant block">
              {shipment.date}
            </span>
          </div>
        </div>

        <StatusBadge
          label={shipment.statusLabel || shipment.status}
          variant={shipment.statusVariant || 'primary'}
          pulse={shipment.status === 'IN_TRANSIT'}
        />
      </div>

      {/* Origin -> Destination Route */}
      <div className="flex items-center justify-between py-2 border-y border-outline-variant/15 text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Origin</span>
          <span className="font-bold text-on-surface text-sm truncate max-w-[120px]">
            {shipment.origin}
          </span>
        </div>

        <div className="flex flex-col items-center px-2 text-outline-variant">
          <Icon name="arrow_forward" size={16} className="text-primary/60" />
        </div>

        <div className="flex flex-col text-right">
          <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Destination</span>
          <span className="font-bold text-on-surface text-sm truncate max-w-[120px]">
            {shipment.destination}
          </span>
        </div>
      </div>

      {/* Bottom Info & Link */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex flex-col">
          <span className="text-[11px] text-on-surface-variant">
            {role === 'agent'
              ? `Customer: ${shipment.recipient?.name || shipment.customerName}`
              : `ETA: ${shipment.estimatedDelivery || 'In Progress'}`}
          </span>
          {shipment.amount && (
            <span className="font-mono text-xs font-bold text-on-surface">
              {shipment.amount}
            </span>
          )}
        </div>

        <Link
          href={defaultHref}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-container transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-container"
        >
          <span>View Details</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>
    </div>
  );
}
