'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Reusable QRDisplay component rendering a high-tech styled QR code card.
 */
export default function QRDisplay({
  value = 'SHP-102938',
  label = 'Shipment QR Code',
  subtitle = 'Scan for instant package verification',
  size = 180,
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 flex flex-col items-center text-center shadow-lg ${className}`}
    >
      <div className="mb-4">
        <h3 className="font-headline-md text-base font-bold text-on-surface">
          {label}
        </h3>
        <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* QR Code Container with Futuristic Target Corners */}
      <div className="relative p-4 bg-white rounded-xl shadow-inner border border-outline-variant/30 flex items-center justify-center">
        {/* Corner Accents */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-primary rounded-tl" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-primary rounded-tr" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-primary rounded-bl" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-primary rounded-br" />

        {/* SVG QR Code Pattern */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="text-on-surface"
        >
          {/* Outer framing blocks */}
          <rect x="5" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="4" rx="2" />
          <rect x="11" y="11" width="16" height="16" fill="currentColor" rx="1" />

          <rect x="67" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="4" rx="2" />
          <rect x="73" y="11" width="16" height="16" fill="currentColor" rx="1" />

          <rect x="5" y="67" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="4" rx="2" />
          <rect x="11" y="73" width="16" height="16" fill="currentColor" rx="1" />

          {/* Center Brand Accent */}
          <rect x="42" y="42" width="16" height="16" fill="#004ac6" rx="3" />
          <circle cx="50" cy="50" r="3" fill="#ffffff" />

          {/* Synthetic QR Data Bits */}
          <rect x="38" y="8" width="8" height="8" fill="currentColor" />
          <rect x="52" y="8" width="6" height="6" fill="currentColor" />
          <rect x="40" y="22" width="6" height="12" fill="currentColor" />
          <rect x="52" y="24" width="8" height="6" fill="currentColor" />
          <rect x="8" y="38" width="12" height="6" fill="currentColor" />
          <rect x="24" y="40" width="8" height="8" fill="currentColor" />
          <rect x="68" y="38" width="10" height="6" fill="currentColor" />
          <rect x="82" y="42" width="10" height="8" fill="currentColor" />
          <rect x="38" y="64" width="8" height="8" fill="currentColor" />
          <rect x="52" y="62" width="6" height="12" fill="currentColor" />
          <rect x="40" y="80" width="14" height="6" fill="currentColor" />
          <rect x="68" y="68" width="8" height="8" fill="currentColor" />
          <rect x="80" y="74" width="12" height="12" fill="currentColor" />
        </svg>
      </div>

      {/* Code Text and Copy Action */}
      <div className="mt-4 flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-primary tracking-wider bg-surface-container-high/60 px-3 py-1.5 rounded-lg border border-outline-variant/30">
          {value}
        </span>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors flex items-center"
          title="Copy tracking code"
        >
          <Icon name={copied ? 'check' : 'content_copy'} size={16} />
        </button>
      </div>
      {copied && (
        <span className="text-[11px] font-semibold text-tertiary mt-1 animate-fade-in">
          Copied to clipboard!
        </span>
      )}
    </div>
  );
}
