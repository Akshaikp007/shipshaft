import React from 'react';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/customer/SettingsClient';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';

export const metadata = {
  title: 'Settings | ShipShaft',
  description: 'Manage account profile, security credentials, and notification preferences.',
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?redirect=/settings');
  }

  if (user.role === ROLES.ADMIN) {
    redirect('/admin/settings');
  }

  if (user.role === ROLES.AGENT) {
    redirect('/agent/settings');
  }

  const serializedUser = {
    id: user._id.toString(),
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'CUSTOMER',
  };

  return <SettingsClient initialUser={serializedUser} />;
}
