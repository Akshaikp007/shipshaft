import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Payment from '@/lib/models/Payment';
import Shipment from '@/lib/models/Shipment';
import Invoice from '@/lib/models/Invoice';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';

/**
 * GET /api/payments/[id]
 * Retrieves payment details by payment ID or shipment tracking number/ID.
 * Enforces ownership: customer can only view their own payments.
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment or shipment identifier is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    let payment = null;

    // Check if `id` is an ObjectId
    if (mongoose.isValidObjectId(id)) {
      payment = await Payment.findById(id)
        .populate('shipmentId', 'trackingNumber status shippingCost customerId')
        .lean();
    }

    // If not found by payment ID, check if `id` is a shipment ID or tracking number
    if (!payment) {
      const isObjectId = mongoose.isValidObjectId(id);
      const shipmentQuery = isObjectId
        ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
        : { trackingNumber: id.toUpperCase().trim() };

      const shipment = await Shipment.findOne(shipmentQuery).lean();
      if (shipment) {
        payment = await Payment.findOne({
          shipmentId: shipment._id,
          status: { $in: ['PAID', 'SUCCESS'] },
        })
          .sort({ createdAt: -1 })
          .populate('shipmentId', 'trackingNumber status shippingCost customerId')
          .lean();
      }
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found.' },
        { status: 404 }
      );
    }

    // Ownership check
    const paymentCustomerId = payment.customerId?.toString();
    const isOwner = paymentCustomerId === user._id.toString();
    const isAdmin = user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found.' },
        { status: 404 }
      );
    }

    // Optionally retrieve associated invoice
    const invoice = await Invoice.findOne({ shipmentId: payment.shipmentId?._id || payment.shipmentId }).lean();

    return NextResponse.json({
      success: true,
      payment: {
        _id: payment._id.toString(),
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        paidAt: payment.paidAt,
        shipment: payment.shipmentId
          ? {
              _id: payment.shipmentId._id.toString(),
              trackingNumber: payment.shipmentId.trackingNumber,
              status: payment.shipmentId.status,
              shippingCost: payment.shipmentId.shippingCost,
            }
          : null,
        invoice: invoice
          ? {
              _id: invoice._id.toString(),
              invoiceNumber: invoice.invoiceNumber,
              total: invoice.total,
              currency: invoice.currency,
              issuedAt: invoice.issuedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[Payment API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve payment details.' },
      { status: 500 }
    );
  }
}
