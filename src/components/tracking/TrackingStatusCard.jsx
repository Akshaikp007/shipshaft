"use client";

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * TrackingStatusCard displays high-level shipment information,
 * origin/destination hubs, estimated arrival, and carrier details.
 */
export default function TrackingStatusCard({ shipment }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (shipment?.trackingNumber && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(shipment.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 shadow-lg relative overflow-hidden group border border-outline-variant/30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0 pointer-events-none"></div>

      {/* Header Row */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
            Tracking ID
          </p>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 font-bold">
            {shipment.trackingNumber}
            <button
              onClick={handleCopy}
              className="text-outline cursor-pointer hover:text-primary transition-colors flex items-center p-1"
              title="Copy to clipboard"
              type="button"
              aria-label="Copy to clipboard"
            >
              <Icon name={copied ? 'check' : 'content_copy'} size={18} />
            </button>
            {copied && (
              <span className="font-label-sm text-label-sm text-tertiary font-semibold animate-fade-in">
                Copied!
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full border border-primary/20">
          <span className="w-2.5 h-2.5 rounded-full bg-primary pulse-ring"></span>
          <span className="font-label-md text-label-md text-primary font-semibold">
            {shipment.statusLabel || shipment.status}
          </span>
        </div>
      </div>

      {/* Origin and Destination Hubs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 relative z-10">
        <div className="bg-surface-container-lowest/50 rounded-lg p-3 border border-outline-variant/30">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
            Origin
          </p>
          <p className="font-title-lg text-title-lg text-on-surface font-semibold">
            {shipment.origin.city}
          </p>
          <p className="font-label-md text-label-md text-outline">{shipment.origin.hub}</p>
        </div>

        <div className="bg-surface-container-lowest/50 rounded-lg p-3 border border-outline-variant/30">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
            Destination
          </p>
          <p className="font-title-lg text-title-lg text-on-surface font-semibold">
            {shipment.destination.city}
          </p>
          <p className="font-label-md text-label-md text-outline">{shipment.destination.hub}</p>
        </div>
      </div>

      {/* Footer: ETA and Carrier */}
      <div className="mt-2 pt-3 border-t border-outline-variant/30 relative z-10 flex justify-between items-center flex-wrap gap-2">
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
            Estimated Arrival (ETA)
          </p>
          <p className="font-title-lg text-title-lg text-primary font-bold">{shipment.eta}</p>
        </div>
        <div className="text-right">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
            Carrier
          </p>
          <p className="font-label-md text-label-md text-on-surface font-semibold">{shipment.carrier}</p>
        </div>
      </div>
    </div>
  );
}
