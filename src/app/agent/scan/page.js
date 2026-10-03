'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import QRScannerUI from '@/components/ui/QRScannerUI';
import Toast from '@/components/ui/Toast';

export default function AgentScanPage() {
  const [toastMessage, setToastMessage] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [recentScans, setRecentScans] = useState([
    { code: 'SHP-102938', id: 'SHP-102938', time: '10 mins ago', status: 'IN_TRANSIT', recipient: 'Priya Nair (Calicut)' },
    { code: 'SHP-BA63B125', id: 'SHP-BA63B125', time: 'Just now', status: 'ASSIGNED', recipient: 'Sarah Jenkins (Bengaluru)' },
  ]);

  const handleScan = async (scannedCode) => {
    if (!scannedCode) return;
    setIsResolving(true);
    setScanError('');
    setScanResult(null);

    try {
      const res = await fetch(`/api/shipments/qr/${encodeURIComponent(scannedCode)}`);
      const data = await res.json();

      if (res.ok && data.success && data.shipment) {
        const shp = data.shipment;
        setScanResult(shp);
        setToastMessage(`Shipment #${shp.trackingNumber} successfully identified!`);

        // Prepend to recent scans list
        setRecentScans((prev) => [
          {
            code: shp.trackingNumber,
            id: shp.id,
            time: 'Just now',
            status: shp.status,
            recipient: `${shp.receiverName} (${shp.destinationCity})`,
          },
          ...prev.filter((s) => s.code !== shp.trackingNumber),
        ]);
      } else {
        const errMsg = data.error || 'Invalid QR code. Shipment not recognized.';
        setScanError(errMsg);
        setToastMessage(errMsg);
      }
    } catch (err) {
      console.error('[Scanner Resolution Error]:', err);
      const errMsg = 'Network error communicating with waybill registry.';
      setScanError(errMsg);
      setToastMessage(errMsg);
    } finally {
      setIsResolving(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setScanError('');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Package Scanner & Waybill Verification
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
            Scan waybill QR code or enter tracking number to verify assigned delivery custody.
          </p>
        </div>

        <Link href="/agent/deliveries">
          <Button variant="secondary" size="sm" icon={<Icon name="arrow_back" size={16} />}>
            Back to Queue
          </Button>
        </Link>
      </div>

      {/* Main Scanner Section */}
      <div className="flex justify-center">
        <QRScannerUI
          onScan={handleScan}
          onScanError={(err) => setToastMessage(err)}
          isResolving={isResolving}
          verifiedShipment={scanResult}
          onReset={handleReset}
        />
      </div>

      {/* Verified Shipment Result Card (Section 18) */}
      {scanResult && (
        <div className="glass-panel border-2 border-primary/30 rounded-2xl p-6 bg-white/95 shadow-lg animate-scale-up space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Icon name="local_shipping" size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-on-surface">
                    #{scanResult.trackingNumber}
                  </span>
                  <StatusBadge
                    label={scanResult.statusLabel}
                    variant={scanResult.status === 'ASSIGNED' ? 'info' : 'primary'}
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Tier: <span className="font-semibold text-on-surface">{scanResult.serviceType}</span> • Weight: {scanResult.weight} kg
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Scan Another
              </Button>
              <Link href={`/agent/deliveries/${scanResult.id}`}>
                <Button variant="primary" size="sm" icon={<Icon name="open_in_new" size={16} />}>
                  Open Delivery
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <span className="text-on-surface-variant block mb-1">Consignee / Receiver</span>
              <span className="font-bold text-on-surface text-sm block">{scanResult.receiverName}</span>
              <span className="text-[11px] text-on-surface-variant block mt-0.5 truncate">{scanResult.receiverAddress}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <span className="text-on-surface-variant block mb-1">Transit Corridor</span>
              <span className="font-bold text-on-surface text-sm block">
                {scanResult.originCity} → {scanResult.destinationCity}
              </span>
              <span className="text-[11px] text-on-surface-variant block mt-0.5 truncate">{scanResult.destination}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <span className="text-on-surface-variant block mb-1">Package Specification</span>
              <span className="font-bold text-on-surface text-sm block truncate">{scanResult.packageDescription}</span>
              <span className="text-[11px] text-tertiary font-bold block mt-0.5">
                Custody Verified • Assigned to You
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {scanError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Icon name="error" size={20} className="text-rose-600 shrink-0" />
            <span className="font-medium">{scanError}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setScanError('')}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Recent Scans Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
            <Icon name="history" size={20} className="text-primary" />
            <span>Recent Session Scans</span>
          </h2>
          <span className="font-mono text-xs text-on-surface-variant">
            {recentScans.length} logged
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recentScans.map((scan, idx) => (
            <div
              key={idx}
              className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{scan.code}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-bold">
                  {scan.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-on-surface truncate">{scan.recipient}</p>
              <div className="flex items-center justify-between text-[11px] text-outline pt-1">
                <span>{scan.time}</span>
                <Link
                  href={`/agent/deliveries/${scan.id || scan.code}`}
                  className="text-primary font-bold hover:underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
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
