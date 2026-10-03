import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Invoice from '@/lib/models/Invoice';
import Shipment from '@/lib/models/Shipment';
import Payment from '@/lib/models/Payment';
import '@/lib/models/User';
import '@/lib/models/Branch';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';

/**
 * GET /api/invoices/[id]
 * Retrieves an invoice by invoice ObjectId, invoiceNumber, or shipment trackingNumber/ID.
 * Enforces ownership: customers can only view their own invoices.
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
        { success: false, error: 'Invoice identifier is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    let invoice = null;

    // 1. Try finding by MongoDB ObjectId
    if (mongoose.isValidObjectId(id)) {
      invoice = await Invoice.findById(id)
        .populate('customerId', 'name email phone company')
        .populate({
          path: 'shipmentId',
          populate: [
            { path: 'originBranchId', select: 'name code city state address' },
            { path: 'destinationBranchId', select: 'name code city state address' },
          ],
        })
        .lean();
    }

    // 2. Try finding by invoiceNumber (case-insensitive)
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceNumber: id.toUpperCase().trim() })
        .populate('customerId', 'name email phone company')
        .populate({
          path: 'shipmentId',
          populate: [
            { path: 'originBranchId', select: 'name code city state address' },
            { path: 'destinationBranchId', select: 'name code city state address' },
          ],
        })
        .lean();
    }

    // 3. Try finding by associated shipment tracking number or ObjectId
    if (!invoice) {
      const isObjectId = mongoose.isValidObjectId(id);
      const shipmentQuery = isObjectId
        ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
        : { trackingNumber: id.toUpperCase().trim() };

      const shipment = await Shipment.findOne(shipmentQuery).lean();
      if (shipment) {
        invoice = await Invoice.findOne({ shipmentId: shipment._id })
          .populate('customerId', 'name email phone company')
          .populate({
            path: 'shipmentId',
            populate: [
              { path: 'originBranchId', select: 'name code city state address' },
              { path: 'destinationBranchId', select: 'name code city state address' },
            ],
          })
          .lean();
      }
    }

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found.' },
        { status: 404 }
      );
    }

    // Ownership check: Customer can only view their own invoice
    const invoiceOwnerId = invoice.customerId?._id?.toString() || invoice.customerId?.toString();
    const isOwner = invoiceOwnerId === user._id.toString();
    const isAdmin = user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found.' },
        { status: 404 }
      );
    }

    // Retrieve corresponding payment details
    const shipmentObj = invoice.shipmentId;
    let payment = null;
    if (shipmentObj) {
      payment = await Payment.findOne({
        shipmentId: shipmentObj._id || shipmentObj,
        status: { $in: ['PAID', 'SUCCESS'] },
      }).lean();
    }

    return NextResponse.json({
      success: true,
      invoice: {
        _id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        issuedAt: invoice.issuedAt,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        currency: invoice.currency,
        customer: invoice.customerId
          ? {
              _id: invoice.customerId._id.toString(),
              name: invoice.customerId.name,
              email: invoice.customerId.email,
              phone: invoice.customerId.phone,
              company: invoice.customerId.company || 'Enterprise Logistics Partner',
            }
          : null,
        shipment: shipmentObj
          ? {
              _id: shipmentObj._id.toString(),
              trackingNumber: shipmentObj.trackingNumber,
              serviceType: shipmentObj.serviceType,
              status: shipmentObj.status,
              weight: shipmentObj.weight,
              senderName: shipmentObj.senderName,
              senderAddress: shipmentObj.senderAddress,
              receiverName: shipmentObj.receiverName,
              receiverAddress: shipmentObj.receiverAddress,
              originBranch: shipmentObj.originBranchId,
              destinationBranch: shipmentObj.destinationBranchId,
            }
          : null,
        payment: payment
          ? {
              _id: payment._id.toString(),
              transactionId: payment.transactionId,
              method: payment.method,
              status: payment.status,
              paidAt: payment.paidAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[Invoice API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve invoice.' },
      { status: 500 }
    );
  }
}
