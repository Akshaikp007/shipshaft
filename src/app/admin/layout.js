import React from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { getCurrentUser } from '@/lib/auth/authorization';

export const metadata = {
  title: {
    template: '%s | ShipShaft Admin Console',
    default: 'Command Center | ShipShaft Admin',
  },
  description: 'Enterprise logistics administration, fleet tracking, and network management.',
};

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  const adminData = {
    name: user?.name || 'Administrator',
    email: user?.email || '',
    role: user?.role || 'ADMIN',
  };

  return <AdminShell adminData={adminData}>{children}</AdminShell>;
}
