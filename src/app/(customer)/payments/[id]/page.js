import React from 'react';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Payment from '@/lib/models/Payment';
import Invoice from '@/lib/models/Invoice';
import '@/lib/models/Branch';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import PaymentClient from '@/components/customer/PaymentClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Payment for #${id} | ShipShaft`,
    description: `Complete secure payment for logistics shipment #${id}.`,
  };
}

export default async function PaymentPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();

  await connectDB();

  const isObjectId = mongoose.isValidObjectId(id);
  const query = isObjectId
    ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
    : { trackingNumber: id.toUpperCase().trim() };

  const shipment = await Shipment.findOne(query)
    .populate('originBranchId', 'name code city state')
    .populate('destinationBranchId', 'name code city state')
    .lean();

  if (!shipment) {
    notFound();
  }

  // Authorization check: Customer can only access their own shipment
  const ownerId = shipment.customerId?._id?.toString() || shipment.customerId?.toString();
  if (user && user.role === ROLES.CUSTOMER && ownerId !== user._id.toString()) {
    notFound();
  }

  // Check if already paid
  const existingPayment = await Payment.findOne({
    shipmentId: shipment._id,
    status: { $in: ['PAID', 'SUCCESS'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const existingInvoice = await Invoice.findOne({ shipmentId: shipment._id }).lean();

  const serializedShipment = {
    _id: shipment._id.toString(),
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    serviceType: shipment.serviceType,
    shippingCost: shipment.shippingCost,
    weight: shipment.weight,
    originCity: shipment.originBranchId?.city || 'Origin Hub',
    destinationCity: shipment.destinationBranchId?.city || 'Destination Hub',
    senderAddress: shipment.senderAddress,
    receiverAddress: shipment.receiverAddress,
    senderName: shipment.senderName,
    receiverName: shipment.receiverName,
  };

  const serializedPayment = existingPayment
    ? {
        _id: existingPayment._id.toString(),
        transactionId: existingPayment.transactionId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        method: existingPayment.method,
        status: existingPayment.status,
        paidAt: existingPayment.paidAt ? existingPayment.paidAt.toISOString() : null,
      }
    : null;

  const serializedInvoice = existingInvoice
    ? {
        _id: existingInvoice._id.toString(),
        invoiceNumber: existingInvoice.invoiceNumber,
      }
    : null;

  return (
    <PaymentClient
      shipmentId={id}
      initialShipment={serializedShipment}
      initialPayment={serializedPayment}
      initialInvoice={serializedInvoice}
    />
  );
}
