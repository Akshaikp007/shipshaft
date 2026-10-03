import React from 'react';
import AgentShell from '@/components/agent/AgentShell';
import { getCurrentUser } from '@/lib/auth/authorization';
import { connectDB } from '@/lib/db';
import Agent from '@/lib/models/Agent';
import '@/lib/models/Branch';

export const metadata = {
  title: {
    template: '%s | ShipShaft Agent',
    default: 'Agent Portal | ShipShaft Logistics',
  },
  description: 'ShipShaft courier operations and last-mile delivery agent terminal.',
};

export default async function AgentLayout({ children }) {
  const user = await getCurrentUser();
  let agent = null;
  if (user) {
    await connectDB();
    agent = await Agent.findOne({ userId: user._id })
      .populate('branchId', 'name code city')
      .lean();
  }

  const agentData = {
    name: user?.name || 'Delivery Agent',
    email: user?.email || '',
    employeeId: agent?.employeeId || 'AGT',
    branchName: agent?.branchId?.city || agent?.branchId?.name || 'Logistics Hub',
    isAvailable: agent?.isAvailable ?? true,
  };

  return <AgentShell agentData={agentData}>{children}</AgentShell>;
}
