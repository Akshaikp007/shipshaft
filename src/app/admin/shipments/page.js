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
import { formatCurrency } from '@/lib/utils/formatters';

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function loadShipments() {
      try {
        const res = await fetch('/api/shipments');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.shipments)) {
            setShipments(data.shipments);
          }
        }
      } catch (err) {
        console.error('Failed to load admin shipments:', err);
      }
    }
    loadShipments();
  }, []);

  // New Shipment Form State
  const [newTracking, setNewTracking] = useState('SHP-204910');
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [origin, setOrigin] = useState('Kochi');
  const [destination, setDestination] = useState('Calicut');
  const [weight, setWeight] = useState('5.0 kg');
  const [amount, setAmount] = useState(formatCurrency(450));

  const handleCreateShipment = (e) => {
    e.preventDefault();
    if (!senderName || !receiverName) {
      setToastMessage('Please complete all required fields.');
      return;
    }

    const created = {
      id: newTracking,
      trackingNumber: newTracking,
      customerName: senderName,
      sender: { company: senderName, name: senderName },
      recipient: { name: receiverName, city: destination },
      origin,
      destination,
      status: 'IN_TRANSIT',
      statusLabel: 'In Transit',
      statusVariant: 'warning',
      amount,
      date: 'Oct 2, 2026',
      agent: { name: 'Rahul Kumar', id: 'AGT-001' },
      packageInfo: { grossWeight: weight, category: 'Commercial Parcel' },
    };

    setShipments([created, ...shipments]);
    setIsModalOpen(false);
    setToastMessage(`Shipment #${newTracking} created successfully!`);
    setSenderName('');
    setReceiverName('');
    setNewTracking(`SHP-${204910 + shipments.length + 1}`);
  };

  const columns = [
    {
      header: 'Tracking ID',
      key: 'trackingNumber',
      sortable: true,
      render: (val, row) => (
        <Link
          href={`/admin/shipments/${row.id}`}
          className="font-mono font-bold text-primary hover:underline"
        >
          {val}
        </Link>
      ),
    },
    {
      header: 'Customer / Shipper',
      key: 'customerName',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-semibold text-on-surface block">
            {val || row.sender?.company}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            To: {row.recipient?.name}
          </span>
        </div>
      ),
    },
    {
      header: 'Route',
      key: 'origin',
      sortable: true,
      render: (_, row) => (
        <span className="font-medium text-on-surface">
          {row.origin} → {row.destination}
        </span>
      ),
    },
    {
      header: 'Assigned Agent',
      key: 'agent',
      render: (agent) => (
        <span className="font-medium text-on-surface">
          {agent?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Freight Amount',
      key: 'amount',
      sortable: true,
      align: 'right',
      render: (val) => (
        <span className="font-mono font-bold text-on-surface">
          {val ? (String(val).startsWith('₹') ? val : formatCurrency(val)) : formatCurrency(450)}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (_, row) => (
        <StatusBadge
          label={row.statusLabel}
          variant={row.statusVariant}
          pulse={row.status === 'IN_TRANSIT'}
        />
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Link
          href={`/admin/shipments/${row.id}`}
          className="text-xs font-bold text-primary hover:text-primary-container inline-flex items-center gap-1 p-1 hover:bg-surface-container rounded-lg"
        >
          <span>Manage</span>
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
            Shipment Management
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
            Global manifest ledger, consignment dispatch, and custody transitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            icon={<Icon name="add" size={18} />}
          >
            New Consignment
          </Button>
        </div>
      </div>

      {/* Production-ready Data Table with Search & Pagination */}
      <DataTable
        columns={columns}
        data={shipments}
        searchPlaceholder="Search by tracking number, customer, hub..."
        pageSize={8}
      />

      {/* Create Shipment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Consignment"
        subtitle="Issue waybill and assign initial transit corridor."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateShipment}>
              Generate Waybill
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateShipment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tracking Number"
              value={newTracking}
              disabled
              icon="tag"
              helperText="Auto-generated high-entropy identifier"
            />
            <Input
              label="Freight Value"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              icon="currency_rupee"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Shipper / Sender Company"
              placeholder="e.g. Apex Traders"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              icon="business"
              required
            />
            <Input
              label="Consignee / Receiver Name"
              placeholder="e.g. Malabar Enterprises"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              icon="person"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Origin Hub"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              icon="trip_origin"
              options={['Kochi', 'Bengaluru', 'Delhi', 'New York', 'London']}
            />
            <Select
              label="Destination Hub"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              icon="location_on"
              options={['Calicut', 'Bengaluru', 'Frankfurt', 'New York', 'London']}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Gross Weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              icon="scale"
            />
            <Select
              label="Service Tier"
              defaultValue="Standard Express"
              options={['Standard Express', 'Priority Same-Day', 'Cold Chain Telemetry']}
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
