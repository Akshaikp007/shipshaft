import CustomerShell from '@/components/customer/CustomerShell';
import { getCurrentUser } from '@/lib/auth/authorization';

export const metadata = {
  title: {
    template: '%s | ShipShaft Logistics',
    default: 'Customer Portal | ShipShaft',
  },
  description: 'Manage, track, and book precision logistics shipments with ShipShaft.',
};

export default async function CustomerLayout({ children }) {
  const user = await getCurrentUser();
  const safeUser = user
    ? {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        avatar: user.avatar || null,
        company: user.company || 'Customer Account',
      }
    : null;

  return <CustomerShell user={safeUser}>{children}</CustomerShell>;
}
