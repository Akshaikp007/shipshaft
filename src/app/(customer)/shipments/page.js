import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import ShipmentsListClient from '@/components/customer/ShipmentsListClient';
import { getCurrentUser } from '@/lib/auth/authorization';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import '@/lib/models/Branch';

export const metadata = {
  title: 'My Shipments | ShipShaft',
  description: 'Manage, search, and track all your active and historical logistics shipments.',
};

export default async function ShipmentsPage() {
  const user = await getCurrentUser();
  await connectDB();

  let customerShipments = [];

  if (user) {
    const rawShipments = await Shipment.find({ customerId: user._id })
      .sort({ createdAt: -1 })
      .populate('destinationBranchId', 'city state code name')
      .populate('originBranchId', 'city state code name')
      .lean();

    customerShipments = rawShipments.map((s) => {
      const destCity = s.destinationBranchId?.city;
      const destState = s.destinationBranchId?.state;
      const destinationText = destCity && destState ? `${destCity}, ${destState}` : s.receiverAddress;

      return {
        _id: s._id.toString(),
        id: s.trackingNumber,
        trackingNumber: s.trackingNumber,
        recipient: {
          name: s.receiverName,
          phone: s.receiverPhone,
          address: s.receiverAddress,
        },
        sender: {
          name: s.senderName,
          phone: s.senderPhone,
          address: s.senderAddress,
        },
        destination: destinationText,
        origin: s.originBranchId ? `${s.originBranchId.city}, ${s.originBranchId.state}` : s.senderAddress,
        date: new Date(s.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status: s.status,
        statusLabel: s.status.replace(/_/g, ' '),
        statusVariant:
          s.status === 'DELIVERED'
            ? 'success'
            : s.status === 'IN_TRANSIT'
            ? 'warning'
            : s.status === 'BOOKED'
            ? 'info'
            : 'primary',
        shippingCost: s.shippingCost,
        serviceType: s.serviceType,
        package: {
          description: s.packageDescription,
          weight: s.weight,
        },
      };
    });
  }

  return (
    <div className="space-y-stack-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
            My Shipments
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage and track your logistics pipeline.
          </p>
        </div>
        <Link
          href="/shipments/book"
          className="btn-premium bg-primary text-on-primary font-label-md text-label-md py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg w-full md:w-auto hover:bg-primary-container transition-all"
        >
          <Icon name="add_box" size={18} />
          <span>Book Shipment</span>
        </Link>
      </div>

      {/* Shipments List & Filter Client Component */}
      <ShipmentsListClient shipments={customerShipments} />
    </div>
  );
}
