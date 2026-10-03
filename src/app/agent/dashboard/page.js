import React from 'react';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Agent from '@/lib/models/Agent';
import Shipment from '@/lib/models/Shipment';
import '@/lib/models/Branch';
import '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import AgentDashboardClient from '@/components/agent/AgentDashboardClient';

export const metadata = {
  title: 'Agent Dashboard | ShipShaft',
  description: 'Operational dispatch queue and delivery verification for assigned couriers.',
};

export default async function AgentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?redirect=/agent/dashboard');
  }

  if (user.role !== ROLES.AGENT && user.role !== ROLES.ADMIN) {
    redirect('/dashboard');
  }

  await connectDB();

  let agent = await Agent.findOne({ userId: user._id })
    .populate('branchId', 'name code city state address')
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
      category: s.packageDescription || 'General Cargo',
      grossWeight: `${s.weight} kg`,
    },
  }));

  const initialAgent = {
    _id: agent?._id?.toString() || '',
    name: user.name || 'Delivery Agent',
    email: user.email,
    employeeId: agent?.employeeId || 'AGT',
    branchName: agent?.branchId?.name || 'Unassigned Hub',
    branchCode: agent?.branchId?.code || '',
    vehicleType: agent?.vehicleType || 'Company Fleet',
    vehicleNumber: agent?.vehicleNumber || 'N/A',
    status: agent?.status || 'ACTIVE',
    availability: agent?.availability || 'AVAILABLE',
  };

  return (
    <AgentDashboardClient
      initialAgent={initialAgent}
      initialDeliveries={deliveries}
    />
  );
}
