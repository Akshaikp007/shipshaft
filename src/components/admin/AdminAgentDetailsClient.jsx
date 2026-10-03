'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ShipmentCard from '@/components/ui/ShipmentCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast from '@/components/ui/Toast';

export default function AdminAgentDetailsClient({ agent, initialShipments = [] }) {
  const [status, setStatus] = useState(agent.status);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const assignedShipments = initialShipments;

  const breadcrumbs = [
    { label: 'Command Center', href: '/admin', icon: 'dashboard' },
    { label: 'Agents & Fleet', href: '/admin/agents', icon: 'group' },
    { label: agent.name },
  ];

  const handleToggleStatus = () => {
    setIsConfirmOpen(false);
    const newStatus = status === 'ACTIVE' ? 'OFFLINE' : 'ACTIVE';
    setStatus(newStatus);
    setToastMessage(`Agent status changed to ${newStatus}!`);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Breadcrumbs and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs items={breadcrumbs} />

        <div className="flex items-center gap-2.5">
          <Link href="/admin/agents">
            <Button variant="secondary" size="sm" icon={<Icon name="arrow_back" size={16} />}>
              Back to Fleet
            </Button>
          </Link>
          <Button
            variant={status === 'ACTIVE' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            icon={<Icon name={status === 'ACTIVE' ? 'block' : 'check'} size={16} />}
          >
            {status === 'ACTIVE' ? 'Set Offline' : 'Activate Duty'}
          </Button>
        </div>
      </div>

      {/* Main Agent Profile Banner */}
      <div className="glass-panel border border-primary/25 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-white via-surface-container-low to-primary/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-bold text-3xl text-primary shadow-lg">
            {(agent.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">
                {agent.id}
              </span>
              <StatusBadge
                label={status === 'ACTIVE' ? 'On Duty' : 'Offline'}
                variant={status === 'ACTIVE' ? 'success' : 'neutral'}
                pulse={status === 'ACTIVE'}
              />
              <span className="font-bold text-tertiary text-xs">
                {agent.rating} ★ Customer Satisfaction
              </span>
            </div>

            <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface">
              {agent.name}
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-on-surface-variant flex items-center gap-2">
              <Icon name="warehouse" size={16} className="text-secondary shrink-0" />
              <span>{agent.branchName} • {agent.assignedZone}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-on-surface-variant block">Direct Phone</span>
            <span className="font-mono font-bold text-on-surface text-sm">{agent.phone}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-on-surface-variant block">Work Email</span>
            <span className="font-semibold text-on-surface">{agent.email}</span>
          </div>
        </div>
      </div>

      {/* Performance KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 text-center">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block mb-1">
            Total Deliveries
          </span>
          <span className="font-headline-md text-2xl font-black text-primary">
            {agent.totalDeliveries}
          </span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 text-center">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block mb-1">
            On-Time SLA
          </span>
          <span className="font-headline-md text-2xl font-black text-tertiary">
            {agent.performanceMetrics?.onTimeRate}
          </span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 text-center">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block mb-1">
            Avg Handover Time
          </span>
          <span className="font-headline-md text-2xl font-black text-on-surface">
            {agent.performanceMetrics?.avgDeliveryTime}
          </span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 text-center">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block mb-1">
            Distance Logged
          </span>
          <span className="font-headline-md text-2xl font-black text-secondary">
            {agent.performanceMetrics?.distanceCoveredToday}
          </span>
        </div>
      </div>

      {/* Equipment and Active Consignments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Vehicle & Hardware Telemetry */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-4">
            <h3 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <Icon name="electric_car" size={18} className="text-primary" />
              <span>Assigned Fleet Vehicle</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-on-surface-variant block">Vehicle Class</span>
                <span className="font-bold text-on-surface text-sm">{agent.vehicleType}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Plate Registration</span>
                <span className="font-mono font-bold text-primary text-sm">{agent.vehicleNumber}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Service Status</span>
                <span className="font-semibold text-tertiary">Passed Q4 Fleet Inspection</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Onboarding Date</span>
                <span className="font-mono text-on-surface">{agent.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Active Assigned Shipments */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2">
            <Icon name="local_shipping" size={18} className="text-primary" />
            <span>Currently Assigned Consignments ({assignedShipments.length})</span>
          </h3>

          {assignedShipments.length === 0 ? (
            <div className="glass-panel border border-outline-variant/30 rounded-2xl p-8 text-center text-on-surface-variant text-xs font-medium">
              No deliveries assigned.
            </div>
          ) : (
            <div className="space-y-4">
              {assignedShipments.map((s) => (
                <ShipmentCard
                  key={s.id}
                  shipment={s}
                  role="admin"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        title={status === 'ACTIVE' ? 'Take Agent Offline?' : 'Activate Agent Duty?'}
        description={`Are you sure you want to change duty status for ${agent.name}? New dispatch queues will be paused while offline.`}
        confirmLabel={status === 'ACTIVE' ? 'Set Offline' : 'Activate Duty'}
        variant={status === 'ACTIVE' ? 'danger' : 'primary'}
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
