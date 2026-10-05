'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ShipmentTimeline from '@/components/ui/ShipmentTimeline';
import OTPVerificationModal from '@/components/ui/OTPVerificationModal';
import Toast from '@/components/ui/Toast';
import AgentLiveGpsTracker from './AgentLiveGpsTracker';
import { formatCurrency } from '@/lib/utils/formatters';

export default function DeliveryDetailsClient({ shipment: initialShipment }) {
  const [shipment, setShipment] = useState(initialShipment);
  const [currentStatus, setCurrentStatus] = useState(initialShipment.status);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [podPhotoUploaded, setPodPhotoUploaded] = useState(false);

  const isDelivered = currentStatus === 'DELIVERED';
  const isOutForDelivery = currentStatus === 'OUT_FOR_DELIVERY';

  const handleVerifyOtpSuccess = (data) => {
    setIsOtpOpen(false);
    setCurrentStatus('DELIVERED');
    setToastMessage(`Delivery confirmed for #${shipment.trackingNumber}! Custody handover verified.`);
    // Add delivered milestone to timeline
    setShipment((prev) => ({
      ...prev,
      status: 'DELIVERED',
      timeline: [
        ...(prev.timeline || []),
        {
          status: 'DELIVERED',
          date: new Date().toLocaleString(),
          location: prev.destinationFull || 'Recipient Destination',
          description: 'Package delivered and handover verified via secure customer OTP.',
        },
      ],
    }));
  };

  const handleAdvanceStatus = async (nextStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/agent/deliveries/${shipment.trackingNumber || shipment.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to advance delivery status.');
      }

      setCurrentStatus(nextStatus);
      setToastMessage(data.message || `Status updated to ${nextStatus.replace(/_/g, ' ')}`);

      setShipment((prev) => ({
        ...prev,
        status: nextStatus,
        statusLabel: nextStatus.replace(/_/g, ' '),
        timeline: [
          ...(prev.timeline || []),
          {
            status: nextStatus.replace(/_/g, ' '),
            date: new Date().toLocaleString(),
            location: prev.destinationFull || 'Logistics Transit Corridor',
            description: `Shipment advanced to ${nextStatus.replace(/_/g, ' ')}.`,
          },
        ],
      }));
    } catch (err) {
      setToastMessage(`Status update error: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const breadcrumbs = [
    { label: 'Agent Dashboard', href: '/agent/dashboard', icon: 'dashboard' },
    { label: 'Delivery Queue', href: '/agent/deliveries', icon: 'local_shipping' },
    { label: shipment.trackingNumber },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Navigation Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs items={breadcrumbs} />

        <div className="flex items-center gap-3">
          <Link href="/agent/deliveries">
            <Button variant="secondary" size="sm" icon={<Icon name="arrow_back" size={16} />}>
              Back to Queue
            </Button>
          </Link>
          <a href={`tel:${shipment.recipient?.phone}`}>
            <Button variant="outline" size="sm" icon={<Icon name="call" size={16} />}>
              Call Customer
            </Button>
          </a>
        </div>
      </div>

      {/* Main Delivery Banner */}
      <div className="glass-panel border border-primary/25 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-white via-surface-container-low to-primary/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
              {shipment.trackingNumber}
            </span>
            <StatusBadge
              label={currentStatus.replace(/_/g, ' ')}
              variant={
                isDelivered
                  ? 'success'
                  : currentStatus === 'OUT_FOR_DELIVERY'
                  ? 'primary'
                  : 'warning'
              }
              pulse={!isDelivered}
            />
            <span className="text-xs text-on-surface-variant font-medium">
              Service: {shipment.service?.tier || 'Standard Express'}
            </span>
          </div>

          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            {shipment.recipient?.name}
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant flex items-center gap-2 mt-1">
            <Icon name="location_on" size={16} className="text-primary shrink-0" />
            <span>{shipment.destinationFull || shipment.recipient?.address}</span>
          </p>
        </div>

        {/* Dynamic Action Buttons Based on Status */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
          {currentStatus === 'ASSIGNED' && (
            <Button
              variant="primary"
              size="lg"
              isLoading={isUpdatingStatus}
              onClick={() => handleAdvanceStatus('PICKED_UP')}
              icon={<Icon name="takeout_dining" size={20} />}
            >
              Pick Up Package
            </Button>
          )}

          {currentStatus === 'PICKED_UP' && (
            <Button
              variant="primary"
              size="lg"
              isLoading={isUpdatingStatus}
              onClick={() => handleAdvanceStatus('IN_TRANSIT')}
              icon={<Icon name="local_shipping" size={20} />}
            >
              Dispatch In Transit
            </Button>
          )}

          {currentStatus === 'IN_TRANSIT' && (
            <Button
              variant="primary"
              size="lg"
              isLoading={isUpdatingStatus}
              onClick={() => handleAdvanceStatus('DESTINATION_HUB')}
              icon={<Icon name="hub" size={20} />}
            >
              Arrive at Destination Hub
            </Button>
          )}

          {currentStatus === 'DESTINATION_HUB' && (
            <Button
              variant="primary"
              size="lg"
              isLoading={isUpdatingStatus}
              onClick={() => handleAdvanceStatus('OUT_FOR_DELIVERY')}
              icon={<Icon name="send" size={20} />}
            >
              Dispatch Out for Delivery
            </Button>
          )}

          {isOutForDelivery && (
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsOtpOpen(true)}
                icon={<Icon name="verified_user" size={20} />}
              >
                Verify OTP & Deliver
              </Button>
              <span className="text-[11px] text-on-surface-variant text-center font-medium">
                Ask customer for email code
              </span>
            </div>
          )}

          {isDelivered && (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-tertiary-container/30 border border-tertiary/30 text-tertiary font-bold text-sm">
              <Icon name="check_circle" size={20} />
              <span>Delivered Successfully</span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Recipient & Package Details / Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live GPS Telemetry Component */}
          <AgentLiveGpsTracker
            shipmentId={shipment.trackingNumber || shipment.id}
            status={currentStatus}
          />

          {/* Recipient Details Card */}
          <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2">
                <Icon name="person" size={18} className="text-primary" />
                <span>Recipient Information</span>
              </h3>
              <span className="font-mono text-xs text-outline font-semibold">
                ACCT {shipment.recipient?.accountNumber || '#8821'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body-md">
              <div>
                <span className="text-on-surface-variant block">Full Name</span>
                <span className="font-bold text-on-surface text-sm">{shipment.recipient?.name}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Company / Department</span>
                <span className="font-semibold text-on-surface">{shipment.recipient?.company || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-on-surface-variant block">Delivery Address</span>
                <span className="font-semibold text-on-surface">{shipment.destinationFull || shipment.recipient?.address}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Contact Phone</span>
                <span className="font-mono font-semibold text-on-surface">{shipment.recipient?.phone || '+91 98470 12345'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Payment Status</span>
                <span className="font-bold text-tertiary">Prepaid Online ({formatCurrency(shipment.pricing?.total || 450)})</span>
              </div>
            </div>
          </div>

          {/* Package Details Card */}
          <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2">
                <Icon name="inventory_2" size={18} className="text-primary" />
                <span>Cargo & Package Specifications</span>
              </h3>
              <span className="font-label-sm text-xs font-semibold text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-full">
                Inspection Passed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-body-md">
              <div>
                <span className="text-on-surface-variant block">Package Category</span>
                <span className="font-semibold text-on-surface">{shipment.packageInfo?.category}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Container Type</span>
                <span className="font-semibold text-on-surface">{shipment.packageInfo?.type || 'Box'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Gross Weight</span>
                <span className="font-mono font-bold text-on-surface">{shipment.packageInfo?.grossWeight}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Dimensions</span>
                <span className="font-mono text-on-surface">{shipment.packageInfo?.dimensions || 'Class Standard'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Quantity</span>
                <span className="font-semibold text-on-surface">{shipment.packageInfo?.quantity || 1} Unit(s)</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Origin Hub</span>
                <span className="font-semibold text-on-surface">{shipment.origin}</span>
              </div>
            </div>
          </div>

          {/* Proof of Delivery (POD) Photo Card */}
          <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-3">
            <h3 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2">
              <Icon name="photo_camera" size={18} className="text-primary" />
              <span>Doorstep Photo Confirmation (POD)</span>
            </h3>
            <p className="text-xs text-on-surface-variant">
              Capture or upload package placement photo at recipient premises for proof of delivery.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => {
                  setPodPhotoUploaded(!podPhotoUploaded);
                  setToastMessage(podPhotoUploaded ? 'Proof photo cleared' : 'Proof photo attached successfully!');
                }}
                className={`py-3 px-5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  podPhotoUploaded
                    ? 'border-tertiary bg-tertiary/10 text-tertiary font-bold'
                    : 'border-outline-variant/40 hover:bg-surface-container text-on-surface'
                }`}
              >
                <Icon name={podPhotoUploaded ? 'check_circle' : 'add_a_photo'} size={18} />
                <span>{podPhotoUploaded ? 'POD Photo Attached' : 'Attach Photo POD'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Tracking Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm">
            <h3 className="font-label-md text-sm font-bold text-on-surface mb-6 flex items-center gap-2">
              <Icon name="timeline" size={18} className="text-primary" />
              <span>Shipment Milestones</span>
            </h3>
            <ShipmentTimeline steps={shipment.timeline || []} />
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        onVerify={handleVerifyOtpSuccess}
        shipmentId={shipment.trackingNumber || shipment.id}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
