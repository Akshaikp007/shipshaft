'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Toast from '@/components/ui/Toast';

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [code, setCode] = useState('HYD-01');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Telangana');
  const [manager, setManager] = useState('');
  const [phone, setPhone] = useState('+91 40 2300 1122');

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        if (data.branches) {
          setBranches(
            data.branches.map((b) => ({
              id: b.code || b._id,
              _id: b._id,
              code: b.code,
              name: b.name,
              city: b.city,
              state: b.state,
              country: 'India',
              address: b.address || `${b.city} Logistics Depot`,
              phone: b.phone || '+91 80 4422 1100',
              manager: b.manager || 'Operations Lead',
              status: b.status || 'ACTIVE',
              statusLabel: 'Operational',
              statusVariant: 'success',
              activeShipments: b.activeShipments || 0,
              totalAgents: b.totalAgents || 0,
              capacityUsage: b.capacityUsage || '25%',
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/branches')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.branches) {
          setBranches(
            data.branches.map((b) => ({
              id: b.code,
              _id: b._id,
              name: b.name,
              code: b.code,
              city: b.city,
              state: b.state,
              country: b.country,
              address: b.address,
              phone: b.phone,
              type: 'Regional Distribution Center',
              status: b.isActive ? 'ACTIVE' : 'INACTIVE',
              capacity: 'Optimal',
              capacityVariant: 'success',
              capacityPercent: 50,
              agentCount: 0,
              activeShipments: 0,
            }))
          );
        }
      })
      .catch((err) => console.error('Failed to load branches:', err));
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!name || !city || !manager || !code) {
      setToastMessage('Please complete all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          city: city.trim(),
          state: stateName.trim(),
          address: `${city} Logistics Park, Phase 1`,
          phone: phone.trim(),
          manager: manager.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(`Logistics Hub ${name} (${code}) established successfully!`);
        setIsModalOpen(false);
        setName('');
        setCity('');
        setManager('');
        loadBranches();
      } else {
        setToastMessage(data.error || 'Failed to establish hub.');
      }
    } catch {
      setToastMessage('Network error establishing branch hub.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Logistics Network Hubs
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
            Global sorting facilities, intermodal waypoints, and localized depot management.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          icon={<Icon name="add_business" size={18} />}
        >
          Establish New Hub
        </Button>
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95">
          <span className="text-[11px] text-on-surface-variant uppercase font-semibold block">Active Facilities</span>
          <span className="font-headline-md text-2xl font-black text-on-surface">{branches.length} Operational</span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95">
          <span className="text-[11px] text-on-surface-variant uppercase font-semibold block">Network Throughput</span>
          <span className="font-headline-md text-2xl font-black text-tertiary">15,650 pkgs/day</span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95">
          <span className="text-[11px] text-on-surface-variant uppercase font-semibold block">Average Capacity</span>
          <span className="font-headline-md text-2xl font-black text-primary">74.2%</span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95">
          <span className="text-[11px] text-on-surface-variant uppercase font-semibold block">Stationed Fleet</span>
          <span className="font-headline-md text-2xl font-black text-secondary">133 Vehicles</span>
        </div>
      </div>

      {/* Hub Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.length === 0 ? (
          <div className="col-span-full glass-panel border border-outline-variant/30 rounded-3xl p-12 text-center text-on-surface-variant font-medium">
            No branches found.
          </div>
        ) : (
          branches.map((hub) => (
          <div
            key={hub.id}
            className="glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 hover:border-primary/40 hover:shadow-lg transition-all duration-200 flex flex-col justify-between gap-5 group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  {hub.code}
                </span>
                <StatusBadge
                  label={hub.statusLabel}
                  variant={hub.statusVariant}
                  pulse={hub.status === 'ACTIVE'}
                />
              </div>

              <h2 className="font-headline-md text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                {hub.name}
              </h2>
              <p className="font-body-md text-xs text-on-surface-variant mt-1 flex items-center gap-1.5">
                <Icon name="location_on" size={14} className="text-secondary shrink-0" />
                <span>{hub.city}, {hub.country}</span>
              </p>

              {/* Metrics */}
              <div className="mt-4 pt-4 border-t border-outline-variant/15 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Facility Manager</span>
                  <span className="font-semibold text-on-surface">{hub.manager}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Active Consignments</span>
                  <span className="font-mono font-bold text-primary">{hub.activeShipments} pkgs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Stationed Agents</span>
                  <span className="font-semibold text-on-surface">{hub.totalAgents} Drivers</span>
                </div>

                {/* Capacity Progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-on-surface-variant">Storage Capacity</span>
                    <span className="font-bold text-on-surface">{hub.capacityUsage}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-outline-variant/20 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        parseInt(hub.capacityUsage) > 85 ? 'bg-secondary' : 'bg-primary'
                      }`}
                      style={{ width: hub.capacityUsage }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/15">
              <Link
                href={`/admin/branches/${hub.id}`}
                className="w-full btn-premium bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span>Inspect Hub Operations</span>
                <Icon name="arrow_forward" size={16} />
              </Link>
            </div>
          </div>
        )))}
      </div>

      {/* Establish Hub Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Establish Logistics Hub"
        subtitle="Provision a sorting facility and connect it to regional routing corridors."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateBranch}>
              Provision Facility
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hub Terminal Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              icon="tag"
              required
            />
            <Input
              label="Facility Name"
              placeholder="e.g. Hyderabad Gateway Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon="warehouse"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Operating City"
              placeholder="e.g. Hyderabad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              icon="location_city"
              required
            />
            <Input
              label="Facility Manager"
              placeholder="e.g. Rajesh Kumar"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              icon="person"
              required
            />
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
