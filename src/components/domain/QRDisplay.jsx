'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * QRDisplay Component
 * Displays a stable server-generated shipment QR code, tracking number, and verification instructions.
 *
 * @param {Object} props
 * @param {string} props.qrToken - Server-generated unique opaque token
 * @param {string} props.trackingNumber - Shipment tracking number
 * @param {string} [props.precomputedDataUrl] - Optional pre-rendered data URL from server component
 * @param {string} [props.className] - Container CSS classes
 */
export default function QRDisplay({
  qrToken,
  trackingNumber,
  precomputedDataUrl,
  className = '',
}) {
  const [clientQrSrc, setClientQrSrc] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (precomputedDataUrl || !qrToken) {
      return;
    }

    let active = true;
    import('qrcode')
      .then((QRCode) => {
        const payload = `SHIPSHAFT:${qrToken}`;
        return QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 256,
          color: {
            dark: '#001A41',
            light: '#FFFFFF',
          },
        });
      })
      .then((url) => {
        if (active) setClientQrSrc(url);
      })
      .catch((err) => console.error('Failed to generate QR data URL:', err));

    return () => {
      active = false;
    };
  }, [qrToken, precomputedDataUrl]);

  const qrSrc = precomputedDataUrl || clientQrSrc;

  const handleCopy = () => {
    if (trackingNumber && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`glass-panel border border-white/40 rounded-2xl p-6 flex flex-col items-center text-center shadow-md bg-white/95 ${className}`}
    >
      {/* QR Code Container */}
      <div className="relative w-44 h-44 bg-white rounded-2xl p-3 mb-4 shadow-sm border border-outline-variant/30 flex items-center justify-center overflow-hidden">
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrSrc}
            alt={`Shipment QR Code for #${trackingNumber}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
            <Icon name="qr_code_2" size={64} className="animate-pulse text-primary/40" />
            <span className="text-[11px] font-medium">Generating Waybill QR...</span>
          </div>
        )}
      </div>

      {/* Title & Tracking Number */}
      <h3 className="font-title-lg text-base md:text-lg text-on-surface font-bold mb-1">
        Waybill Digital Pass
      </h3>

      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-xs md:text-sm font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/20">
          #{trackingNumber}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 text-on-surface-variant hover:text-primary transition-colors rounded hover:bg-surface-container"
          title="Copy Tracking Number"
        >
          <Icon name={copied ? 'check' : 'content_copy'} size={16} />
        </button>
      </div>

      <p className="font-body-md text-xs text-on-surface-variant max-w-xs">
        Scan this QR code to identify your shipment at any hub terminal or during custody handover.
      </p>

      {/* Security Opaque Badge */}
      <div className="mt-4 pt-3 border-t border-outline-variant/20 w-full flex items-center justify-center gap-1.5 text-[11px] text-tertiary font-semibold">
        <Icon name="verified_user" size={14} />
        <span>Cryptographically Encoded Opaque Token</span>
      </div>
    </div>
  );
}
