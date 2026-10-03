import React from 'react';
import NotificationsClient from '@/components/customer/NotificationsClient';
import { getCurrentUser } from '@/lib/auth/authorization';
import { connectDB } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import '@/lib/models/Shipment';

export const metadata = {
  title: 'Notifications | ShipShaft',
  description: 'Stay updated on shipment deliveries, status transitions, and payment alerts.',
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  let dbNotifications = [];

  if (user) {
    await connectDB();
    const rawNotifs = await Notification.find({ recipientId: user._id })
      .populate('relatedShipmentId', 'trackingNumber status')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    dbNotifications = rawNotifs.map((n) => {
      const trackingNumber = n.relatedShipmentId?.trackingNumber;
      return {
        id: n._id.toString(),
        title: n.title,
        description: n.message,
        timestamp: new Date(n.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        isUnread: !n.read,
        category: n.type === 'PAYMENT' ? 'Billing & Payments' : 'Shipment Status',
        icon: n.type === 'PAYMENT' ? 'payments' : 'local_shipping',
        iconBg: n.type === 'PAYMENT' ? 'bg-status-success/15' : 'bg-primary/10',
        iconColor: n.type === 'PAYMENT' ? 'text-tertiary' : 'text-primary',
        actionText: trackingNumber ? 'View Shipment' : null,
        actionHref: trackingNumber ? `/shipments/${trackingNumber}` : null,
      };
    });
  }

  return <NotificationsClient initialNotifications={dbNotifications} />;
}
