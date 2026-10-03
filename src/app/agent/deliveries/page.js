import React from 'react';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Agent from '@/lib/models/Agent';
import Shipment from '@/lib/models/Shipment';
import '@/lib/models/Branch';
import '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import AgentDeliveriesClient from '@/components/agent/AgentDeliveriesClient';

export const metadata = {
  title: 'Delivery Queue | ShipShaft Agent',
  description: 'Doorstep dispatch ledger and delivery management for assigned couriers.',
};

export default async function AgentDeliveriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?redirect=/agent/deliveries');
  }

  if (user.role !== ROLES.AGENT && user.role !== ROLES.ADMIN) {
    redirect('/login');
  }

  await connectDB();

  let agent = await Agent.findOne({ userId: user._id })
    .populate('branchId', 'name code city state')
    .lean();

  let rawDeliveries = [];
  if (agent) {
    rawDeliveries = await Shipment.find({ agentId: agent._id })
      .populate('destinationBranchId', 'name code city state address')
      .populate('originBranchId', 'name code city state address')
      .sort({ updatedAt: -1 })
      .lean();
  }

  const deliveries = rawDeliveries.map((s) => ({
    id: s.trackingNumber,
    _id: s._id.toString(),
    trackingNumber: s.trackingNumber,
    status: s.status,
    statusLabel: s.status.replace(/_/g, ' '),
    statusVariant:
      s.status === 'DELIVERED'
        ? 'success'
        : s.status === 'ASSIGNED'
        ? 'primary'
        : 'warning',
    origin: s.originBranchId?.city || 'Origin',
    destination: s.destinationBranchId?.city || 'Destination',
    destinationFull: s.destinationBranchId?.name
      ? `${s.destinationBranchId.name} (${s.destinationBranchId.code})`
      : s.receiverAddress,
    recipient: {
      name: s.receiverName,
      address: s.receiverAddress,
      phone: s.receiverPhone,
      city: s.destinationBranchId?.city || '',
    },
    date: new Date(s.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    amount: `$${Number(s.shippingCost || 0).toFixed(2)}`,
    weight: s.weight,
    packageInfo: {
      category: s.packageDescription || 'General Freight',
      grossWeight: `${s.weight} kg`,
    },
  }));

  const agentInfo = {
    _id: agent?._id?.toString() || '',
    name: user.name || 'Delivery Courier',
    employeeId: agent?.employeeId || 'AGT',
    branchName: agent?.branchId?.name || 'Unassigned Hub',
  };

  return (
    <AgentDeliveriesClient
      initialDeliveries={deliveries}
      agentInfo={agentInfo}
    />
  );
}
