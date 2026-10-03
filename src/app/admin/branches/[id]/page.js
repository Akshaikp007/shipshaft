import React from 'react';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import AdminBranchDetailsClient from '@/components/admin/AdminBranchDetailsClient';
import { connectDB } from '@/lib/db';
import Branch from '@/lib/models/Branch';
import Agent from '@/lib/models/Agent';
import Shipment from '@/lib/models/Shipment';
import '@/lib/models/User';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Hub #${id} Telemetry | ShipShaft Admin`,
    description: `Throughput, fleet capacity, and warehouse operations for hub #${id}.`,
  };
}

export default async function AdminBranchDetailsPage({ params }) {
  const { id } = await params;
  await connectDB();

  const isObjectId = mongoose.isValidObjectId(id);
  const query = isObjectId
    ? { $or: [{ _id: id }, { code: id.toUpperCase().trim() }] }
    : { code: id.toUpperCase().trim() };

  const dbBranch = await Branch.findOne(query).lean();
  if (!dbBranch) {
    notFound();
  }

  const [rawAgents, rawShipments] = await Promise.all([
    Agent.find({ branchId: dbBranch._id }).populate('userId', 'name email phone avatar').lean(),
    Shipment.find({
      $or: [{ originBranchId: dbBranch._id }, { destinationBranchId: dbBranch._id }],
    })
      .populate('originBranchId', 'city')
      .populate('destinationBranchId', 'city')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const stationedAgents = rawAgents.map((a) => ({
    id: a.employeeId,
    _id: a._id.toString(),
    name: a.userId?.name || a.employeeId,
    phone: a.userId?.phone || '',
    email: a.userId?.email || '',
    status: a.status || 'ACTIVE',
    statusLabel: a.status === 'ACTIVE' ? 'On Duty' : 'Off Duty',
    statusVariant: a.status === 'ACTIVE' ? 'success' : 'neutral',
    vehicleType: a.vehicleType || 'Fleet Van',
    vehicleNumber: a.vehicleNumber || 'N/A',
  }));

  const hubShipments = rawShipments.map((s) => ({
    id: s.trackingNumber,
    trackingNumber: s.trackingNumber,
    status: s.status,
    statusLabel: s.status.replace(/_/g, ' '),
    statusVariant:
      s.status === 'DELIVERED'
        ? 'success'
        : s.status === 'IN_TRANSIT'
        ? 'warning'
        : 'primary',
    origin: s.originBranchId?.city || 'Origin',
    destination: s.destinationBranchId?.city || 'Destination',
    amount: `$${Number(s.shippingCost || 0).toFixed(2)}`,
    weight: `${s.weight} kg`,
    recipient: { name: s.receiverName },
    date: new Date(s.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  const branch = {
    _id: dbBranch._id.toString(),
    id: dbBranch.code,
    code: dbBranch.code,
    name: dbBranch.name,
    city: dbBranch.city,
    state: dbBranch.state,
    address: dbBranch.address,
    phone: dbBranch.phone || '+91 80 4422 1100',
    manager: dbBranch.manager || 'Operations Lead',
    status: 'ACTIVE',
    statusLabel: 'Operational',
    statusVariant: 'success',
    activeShipments: hubShipments.filter((s) => s.status !== 'DELIVERED').length,
    totalAgents: stationedAgents.length,
    capacityUsage: `${Math.min(stationedAgents.length * 10, 100)}%`,
    dailyThroughput: `${hubShipments.length} consignments`,
  };

  return (
    <AdminBranchDetailsClient
      branch={branch}
      stationedAgents={stationedAgents}
      hubShipments={hubShipments}
    />
  );
}
