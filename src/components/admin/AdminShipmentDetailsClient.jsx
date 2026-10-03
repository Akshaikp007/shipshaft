'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ShipmentTimeline from '@/components/ui/ShipmentTimeline';
import Select from '@/components/ui/Select';
import Toast from '@/components/ui/Toast';

export default function AdminShipmentDetailsClient({ shipment, availableAgents = [] }) {
  const [assignedAgent, setAssignedAgent] = useState(shipment.agent?._id || shipment.agent?.id || '');
  const [currentAgent, setCurrentAgent] = useState(shipment.agent || null);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const breadcrumbs = [
    { label: 'Command Center', href: '/admin', icon: 'dashboard' },
    { label: 'Shipments', href: '/admin/shipments', icon: 'local_shipping' },
    { label: shipment.trackingNumber },
  ];

  const handleAgentChange = async (newAgentId) => {
    if (!newAgentId) return;
    setIsUpdatingAgent(true);
    try {
      const response = await fetch(`/api/admin/shipments/${shipment.trackingNumber || shipment.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: newAgentId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign agent');
      }

      setAssignedAgent(newAgentId);
      const foundAgent = availableAgents.find((a) => (a._id || a.id) === newAgentId);
      if (foundAgent) {
        setCurrentAgent({
          _id: foundAgent._id,
          id: foundAgent.employeeId,
          employeeId: foundAgent.employeeId,
          name: foundAgent.name,
          branch: foundAgent.branchCode ? `Branch ${foundAgent.branchCode}` : shipment.destinationFull,
          vehicleType: currentAgent?.vehicleType || 'Delivery Van',
          vehicleNumber: currentAgent?.vehicleNumber || 'N/A',
          availability: 'BUSY',
          status: 'ACTIVE',
        });
      }
      setToastMessage(data.message || 'Agent assigned successfully!');
    } catch (err) {
      setToastMessage(`Assignment Error: ${err.message}`);
    } finally {
      setIsUpdatingAgent(false);
    }
  };

  const isDelivered = shipment.status === 'DELIVERED';
  const isOutForDelivery = shipment.status === 'OUT_FOR_DELIVERY';
  const isPaymentConfirmed = shipment.status === 'PAYMENT_CONFIRMED';
  const isBooked = shipment.status === 'BOOKED';

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Breadcrumbs and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs items={breadcrumbs} />

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/admin/shipments">
            <Button variant="secondary" size="sm" icon={<Icon name="arrow_back" size={16} />}>
              Back to Manifest
            </Button>
          </Link>
          <Link href={`/invoices/${shipment.id}`}>
            <Button variant="outline" size="sm" icon={<Icon name="receipt_long" size={16} />}>
              Official Invoice
            </Button>
          </Link>
          {(isOutForDelivery || shipment.status === 'IN_TRANSIT') && (
            <Link href={`/customer/shipments/${shipment.trackingNumber}`} target="_blank">
              <Button variant="primary" size="sm" icon={<Icon name="radar" size={16} />}>
                Live GPS Telemetry
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Overview Banner */}
      <div className="glass-panel border border-primary/25 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-white via-surface-container-low to-primary/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="font-mono text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">
              {shipment.trackingNumber}
            </span>
            <StatusBadge
              label={shipment.statusLabel || shipment.status.replace(/_/g, ' ')}
              variant={
                isDelivered
                  ? 'success'
                  : shipment.status === 'ASSIGNED'
                  ? 'primary'
                  : 'warning'
              }
              pulse={shipment.status === 'IN_TRANSIT' || isOutForDelivery}
            />
            <span className="text-xs text-on-surface-variant font-medium">
              Registered: {shipment.date}
            </span>
          </div>

          <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            {shipment.origin} → {shipment.destination}
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant flex items-center gap-2 mt-1">
            <Icon name="schedule" size={16} className="text-secondary shrink-0" />
            <span>Expected Delivery: {shipment.estimatedDelivery} • ShipShaft Logistics Network</span>
          </p>
        </div>

        {/* Operational State Indicator */}
        <div className="flex flex-col items-start md:items-end justify-center bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-4 min-w-[240px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Authoritative Lifecycle Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-3 h-3 rounded-full ${
                isDelivered
                  ? 'bg-success'
                  : isOutForDelivery || shipment.status === 'IN_TRANSIT'
                  ? 'bg-primary animate-pulse'
                  : 'bg-warning'
              }`}
            />
            <span className="text-base font-extrabold text-on-surface">
              {shipment.status.replace(/_/g, ' ')}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant mt-1">
            {isDelivered
              ? 'Handover completed via OTP'
              : isOutForDelivery
              ? 'Doorstep delivery underway'
              : isPaymentConfirmed
              ? 'Ready for courier assignment'
              : isBooked
              ? 'Pending payment confirmation'
              : 'En route via assigned courier'}
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stakeholders, Specifications, and Fleet Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sender & Recipient Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sender */}
            <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 shadow-sm space-y-2">
              <span className="font-label-sm text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                <Icon name="trip_origin" size={14} />
                <span>Shipper / Origin</span>
              </span>
              <div className="text-xs font-body-md text-on-surface">
                <span className="font-bold text-sm block">{shipment.sender?.company || shipment.customerName}</span>
                <span>{shipment.originFull || shipment.sender?.address}</span>
                <span className="block text-on-surface-variant mt-1 font-mono">{shipment.sender?.phone || 'N/A'}</span>
              </div>
            </div>

            {/* Recipient */}
            <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 shadow-sm space-y-2">
              <span className="font-label-sm text-xs font-bold text-secondary uppercase flex items-center gap-1.5">
                <Icon name="location_on" size={14} />
                <span>Consignee / Destination</span>
              </span>
              <div className="text-xs font-body-md text-on-surface">
                <span className="font-bold text-sm block">{shipment.recipient?.name}</span>
                <span>{shipment.destinationFull || shipment.recipient?.address}</span>
                {shipment.recipient?.phone && (
                  <span className="block text-on-surface-variant mt-1 font-mono">{shipment.recipient.phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Consignment Specifications & Tariff */}
          <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
            <h3 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <Icon name="inventory_2" size={18} className="text-primary" />
              <span>Consignment Specifications & Tariff</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-body-md">
              <div>
                <span className="text-on-surface-variant block">Commodity</span>
                <span className="font-semibold text-on-surface">{shipment.packageInfo?.category || 'General Freight'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Gross Weight</span>
                <span className="font-mono font-bold text-on-surface">{shipment.packageInfo?.grossWeight || 'N/A'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Dimensions</span>
                <span className="font-mono text-on-surface">{shipment.packageInfo?.dimensions || 'Standard'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Freight Charge</span>
                <span className="font-mono font-bold text-primary text-sm">{shipment.amount || '$0.00'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Fleet & Agent Details */}
          <div className="glass-panel border border-outline-variant/30 rounded-2xl p-6 bg-white/95 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2">
                <Icon name="badge" size={18} className="text-primary" />
                <span>Assigned Dispatch Agent</span>
              </h3>
              {currentAgent?._id && (
                <Link href={`/admin/agents/${currentAgent._id}`} className="text-xs font-bold text-primary hover:underline">
                  View Agent Profile
                </Link>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  <Icon name="person" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface text-sm">
                      {currentAgent?.name || 'Unassigned'}
                    </span>
                    {currentAgent?.employeeId && (
                      <span className="text-[11px] font-mono font-bold bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant">
                        {currentAgent.employeeId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant block mt-0.5">
                    {currentAgent?.branch || shipment.destinationFull || 'Destination Hub'}
                  </span>
                  {currentAgent?.vehicleNumber && currentAgent.vehicleNumber !== 'N/A' && (
                    <span className="text-[11px] text-outline font-mono block mt-0.5">
                      Vehicle: {currentAgent.vehicleType} • {currentAgent.vehicleNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Status-specific Agent Management */}
              {!isDelivered && (
                <div className="w-full sm:w-64">
                  <Select
                    label={currentAgent ? 'Reassign Agent' : 'Assign Agent'}
                    value={assignedAgent}
                    onChange={(e) => handleAgentChange(e.target.value)}
                    disabled={isUpdatingAgent}
                    options={
                      availableAgents.length > 0
                        ? [
                            { value: '', label: '-- Select Courier --' },
                            ...availableAgents.map((a) => ({
                              value: a._id || a.id,
                              label: `${a.name || a.employeeId} (${a.employeeId})`,
                            })),
                          ]
                        : [{ value: '', label: 'No agents available for hub' }]
                    }
                  />
                </div>
              )}
            </div>

            {/* Operational Security Note */}
            {isOutForDelivery && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary flex items-center gap-2">
                <Icon name="verified_user" size={16} className="shrink-0" />
                <span>
                  Delivery authentication active. Courier verifies handover with recipient email OTP.
                </span>
              </div>
            )}
            {isDelivered && (
              <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-xs text-success-dark font-medium flex items-center gap-2">
                <Icon name="check_circle" size={16} className="shrink-0 text-success" />
                <span>
                  Shipment delivered and verified via customer OTP. Manifest lifecycle closed.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Authoritative Tracking Milestones */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2">
                <Icon name="timeline" size={18} className="text-primary" />
                <span>Tracking History & Milestones</span>
              </h3>
              <span className="text-[11px] font-mono text-outline">
                {shipment.trackingHistory?.length || 0} Events Logged
              </span>
            </div>

            {/* Authoritative Database-Driven Timeline */}
            <ShipmentTimeline steps={shipment.timeline || []} />
          </div>

          {/* Checkpoint Audit Trail */}
          {shipment.trackingHistory && shipment.trackingHistory.length > 0 && (
            <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-3">
              <h4 className="font-label-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="history" size={16} className="text-secondary" />
                <span>Database Checkpoint Log</span>
              </h4>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {shipment.trackingHistory.slice().reverse().map((evt) => (
                  <div
                    key={evt._id}
                    className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-on-surface">{evt.statusLabel || evt.status}</span>
                      <span className="text-[10px] font-mono text-outline">{evt.date}</span>
                    </div>
                    <p className="text-on-surface-variant text-[11px]">{evt.description}</p>
                    {evt.location && (
                      <span className="text-[10px] text-primary flex items-center gap-1">
                        <Icon name="location_on" size={11} />
                        {evt.location}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
