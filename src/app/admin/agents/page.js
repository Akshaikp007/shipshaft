'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Toast from '@/components/ui/Toast';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [branchId, setBranchId] = useState('');
  const [vehicle, setVehicle] = useState('Electric Delivery Van');

  // Fetch live agents and branches from API
  useEffect(() => {
    async function loadData() {
      try {
        const [agentsRes, branchesRes] = await Promise.all([
          fetch('/api/admin/agents'),
          fetch('/api/branches'),
        ]);

        if (branchesRes.ok) {
          const bData = await branchesRes.json();
          if (bData.branches) {
            setBranches(bData.branches);
            if (bData.branches.length > 0) setBranchId(bData.branches[0]._id);
          }
        }

        if (agentsRes.ok) {
          const aData = await agentsRes.json();
          if (aData.agents) {
            setAgents(
              aData.agents.map((a) => ({
                id: a.employeeId,
                _id: a._id,
                name: a.name || 'Agent',
                phone: a.phone || '',
                email: a.email || '',
                status: a.status || 'ACTIVE',
                statusLabel:
                  a.status === 'ACTIVE'
                    ? 'On Duty'
                    : a.status === 'TRANSIT'
                    ? 'In Transit'
                    : 'Off Duty',
                statusVariant:
                  a.status === 'ACTIVE'
                    ? 'success'
                    : a.status === 'TRANSIT'
                    ? 'warning'
                    : 'neutral',
                branchId: a.branch?._id,
                branchName: a.branch?.name || 'Local Hub',
                assignedZone: `${a.branch?.city || 'Metro'} Corridor`,
                vehicleType: a.vehicleType || 'Company Fleet',
                vehicleNumber: a.vehicleNumber || 'N/A',
                workload: a.workload || 0,
                rating: 5.0,
                totalDeliveries: a.workload || 0,
                completedToday: 0,
                pendingToday: a.workload || 0,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load agents from API:', err);
      }
    }
    loadData();
  }, []);

  const handleEnrollAgent = async (e) => {
    e.preventDefault();
    if (!name || !email || !branchId) {
      setToastMessage('Please complete all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          branchId,
          vehicleType: vehicle,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(`Agent ${name} enrolled with ID #${data.agent.employeeId}!`);
        setIsModalOpen(false);
        setName('');
        setPhone('');
        setEmail('');
        // Reload list
        const refreshed = await fetch('/api/admin/agents');
        if (refreshed.ok) {
          const rData = await refreshed.json();
          if (rData.agents) {
            setAgents(
              rData.agents.map((a) => ({
                id: a.employeeId,
                _id: a._id,
                name: a.name || 'Agent',
                phone: a.phone || '',
                email: a.email || '',
                status: a.status || 'ACTIVE',
                statusLabel:
                  a.status === 'ACTIVE'
                    ? 'On Duty'
                    : a.status === 'TRANSIT'
                    ? 'In Transit'
                    : 'Off Duty',
                statusVariant:
                  a.status === 'ACTIVE'
                    ? 'success'
                    : a.status === 'TRANSIT'
                    ? 'warning'
                    : 'neutral',
                branchId: a.branch?._id,
                branchName: a.branch?.name || 'Local Hub',
                assignedZone: `${a.branch?.city || 'Metro'} Corridor`,
                vehicleType: a.vehicleType || 'Company Fleet',
                vehicleNumber: a.vehicleNumber || 'N/A',
                workload: a.workload || 0,
                rating: 5.0,
                totalDeliveries: a.workload || 0,
                completedToday: 0,
                pendingToday: a.workload || 0,
              }))
            );
          }
        }
      } else {
        setToastMessage(data.error || 'Failed to enroll agent.');
      }
    } catch {
      setToastMessage('Network error enrolling agent.');
    }
  };

  const columns = [
    {
      header: 'Agent Name & ID',
      key: 'name',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
            {(val || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <Link
              href={`/admin/agents/${row.id}`}
              className="font-bold text-on-surface hover:text-primary transition-colors block"
            >
              {val}
            </Link>
            <span className="font-mono text-[11px] text-primary">{row.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Hub & Operating Zone',
      key: 'branchName',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-semibold text-on-surface block">{val}</span>
          <span className="text-[11px] text-on-surface-variant">{row.assignedZone}</span>
        </div>
      ),
    },
    {
      header: 'Assigned Vehicle',
      key: 'vehicleType',
      render: (val, row) => (
        <div>
          <span className="font-medium text-on-surface block">{val}</span>
          <span className="font-mono text-[11px] text-on-surface-variant">{row.vehicleNumber}</span>
        </div>
      ),
    },
    {
      header: 'Today Deliveries',
      key: 'completedToday',
      align: 'center',
      render: (val, row) => (
        <span className="font-mono font-bold text-on-surface">
          {val} done / {row.pendingToday} pend
        </span>
      ),
    },
    {
      header: 'Rating',
      key: 'rating',
      align: 'center',
      sortable: true,
      render: (val) => (
        <span className="font-bold text-tertiary">
          {val} ★
        </span>
      ),
    },
    {
      header: 'Duty Status',
      key: 'status',
      align: 'center',
      render: (_, row) => (
        <StatusBadge
          label={row.statusLabel}
          variant={row.statusVariant}
          pulse={row.status === 'ACTIVE' || row.status === 'TRANSIT'}
        />
      ),
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (_, row) => (
        <Link
          href={`/admin/agents/${row.id}`}
          className="text-xs font-bold text-primary hover:text-primary-container inline-flex items-center gap-1 p-1 hover:bg-surface-container rounded-lg"
        >
          <span>Profile</span>
          <Icon name="chevron_right" size={16} />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Agent & Fleet Management
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
            Driver roster, route allocation, performance metrics, and equipment status.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          icon={<Icon name="person_add" size={18} />}
        >
          Enroll Agent
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95">
          <span className="text-[11px] text-on-surface-variant uppercase font-semibold block">Total Agents</span>
          <span className="font-headline-md text-2xl font-black text-on-surface">{agents.length} Active</span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95">
          <span className="text-[11px] text-on-surface-variant uppercase font-semibold block">On Duty Today</span>
          <span className="font-headline-md text-2xl font-black text-tertiary">
            {agents.filter((a) => a.status === 'ACTIVE').length} Units
          </span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95">
          <span className="text-[11px] text-on-surface-variant uppercase font-semibold block">In Transit</span>
          <span className="font-headline-md text-2xl font-black text-secondary">
            {agents.filter((a) => a.status === 'TRANSIT').length} Units
          </span>
        </div>
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-4 bg-white/95">
          <span className="text-[11px] text-on-surface-variant uppercase font-semibold block">Fleet On-Time Avg</span>
          <span className="font-headline-md text-2xl font-black text-primary">98.1%</span>
        </div>
      </div>

      {/* Agents Table */}
      <DataTable
        columns={columns}
        data={agents}
        searchPlaceholder="Search agents by name, hub, vehicle..."
        pageSize={6}
      />

      {/* Enroll Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll New Delivery Agent"
        subtitle="Add a certified driver to the ShipShaft operations roster."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleEnrollAgent}>
              Complete Enrollment
            </Button>
          </>
        }
      >
        <form onSubmit={handleEnrollAgent} className="space-y-4">
          <Input
            label="Full Agent Name"
            placeholder="e.g. Ramesh Nair"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon="person"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              placeholder="+91 98..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon="call"
              required
            />
            <Input
              label="Work Email"
              placeholder="agent@shipshaft.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon="mail"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Logistics Hub"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              icon="warehouse"
              options={
                branches.length > 0
                  ? branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))
                  : [{ value: '', label: 'No hubs available' }]
              }
            />
            <Select
              label="Assigned Vehicle Class"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              icon="directions_car"
              options={['Electric Delivery Van', 'Cargo Sprinter', 'Heavy Hauler', 'Motorcycle Courier']}
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
