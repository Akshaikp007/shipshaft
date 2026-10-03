import React from 'react';
import SettingsClient from '@/components/customer/SettingsClient';
import { getCurrentUser } from '@/lib/auth/authorization';

export const metadata = {
  title: 'Settings | ShipShaft',
  description: 'Manage account profile, security credentials, and notification preferences.',
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const serializedUser = user
    ? {
        id: user._id.toString(),
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'CUSTOMER',
      }
    : null;

  return <SettingsClient initialUser={serializedUser} />;
}
