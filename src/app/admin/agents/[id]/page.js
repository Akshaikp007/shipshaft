import React from 'react';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import AdminAgentDetailsClient from '@/components/admin/AdminAgentDetailsClient';
import { connectDB } from '@/lib/db';
import Agent from '@/lib/models/Agent';
import Shipment from '@/lib/models/Shipment';
import '@/lib/models/User';
import '@/lib/models/Branch';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Agent #${id} Profile | ShipShaft Admin`,
    description: `Performance metrics, fleet assignment, and delivery history for agent #${id}.`,
  };
}

export default async function AdminAgentDetailsPage({ params }) {
  const { id } = await params;
  await connectDB();

  const isObjectId = mongoose.isValidObjectId(id);
  const query = isObjectId
    ? { $or: [{ _id: id }, { employeeId: id.toUpperCase().trim() }] }
    : { employeeId: id.toUpperCase().trim() };

  const dbAgent = await Agent.findOne(query)
    .populate('userId', 'name email phone avatar')
    .populate('branchId', 'name code city state')
    .lean();

  if (!dbAgent) {
    notFound();
  }

  const rawShipments = await Shipment.find({ agentId: dbAgent._id })
    .populate('originBranchId', 'city')
    .populate('destinationBranchId', 'city')
    .sort({ createdAt: -1 })
    .lean();

  const shipments = rawShipments.map((s) => ({
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

  const agent = {
    _id: dbAgent._id.toString(),
    id: dbAgent.employeeId,
    name: dbAgent.userId?.name || dbAgent.employeeId,
    email: dbAgent.userId?.email || '',
    phone: dbAgent.userId?.phone || '',
    status: dbAgent.status || 'ACTIVE',
    branchName: dbAgent.branchId?.name || 'Local Hub',
    assignedZone: `${dbAgent.branchId?.city || 'Metro'} Corridor`,
    vehicleType: dbAgent.vehicleType || 'Company Fleet',
    vehicleNumber: dbAgent.vehicleNumber || 'N/A',
    rating: 5.0,
    totalDeliveries: shipments.length,
    completedToday: shipments.filter((s) => s.status === 'DELIVERED').length,
    pendingToday: shipments.filter((s) => s.status !== 'DELIVERED').length,
  };

  return <AdminAgentDetailsClient agent={agent} initialShipments={shipments} />;
}
