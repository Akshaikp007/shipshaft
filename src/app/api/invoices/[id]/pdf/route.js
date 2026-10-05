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
import { generateInvoicePdfBuffer } from '@/lib/services/invoicePdfService';

/**
 * GET /api/invoices/[id]/pdf
 * Generates and downloads a real, official ShipShaft PDF invoice.
 * Supports lookup by:
 * 1. Invoice MongoDB ObjectId
 * 2. Invoice Number (e.g. INV-2026-001)
 * 3. Shipment Tracking Number (e.g. SHP-2026-001) or Shipment ObjectId
 *
 * Enforces authentication and RBAC:
 * - Customers can only download invoices for their own shipments.
 * - Administrators and Operations Staff can download any invoice.
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to download invoice.' },
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
            { path: 'originBranchId', select: 'name code city state address phone' },
            { path: 'destinationBranchId', select: 'name code city state address phone' },
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
            { path: 'originBranchId', select: 'name code city state address phone' },
            { path: 'destinationBranchId', select: 'name code city state address phone' },
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
              { path: 'originBranchId', select: 'name code city state address phone' },
              { path: 'destinationBranchId', select: 'name code city state address phone' },
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

    // RBAC Ownership check: Customer can only download their own invoice
    const invoiceOwnerId = invoice.customerId?._id?.toString() || invoice.customerId?.toString();
    const isOwner = invoiceOwnerId === user._id.toString();
    const isStaffOrAdmin = user.role === ROLES.ADMIN || user.role === ROLES.AGENT || user.role === ROLES.DRIVER;

    if (!isOwner && !isStaffOrAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied: You can only download your own invoices.' },
        { status: 403 }
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

    // Generate real PDF binary buffer
    const pdfBuffer = generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt || invoice.createdAt,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      currency: invoice.currency || 'INR',
      customer: invoice.customerId,
      shipment: shipmentObj,
      payment: payment,
    });

    const filename = `ShipShaft-Invoice-${invoice.invoiceNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Invoice PDF Route Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice PDF.' },
      { status: 500 }
    );
  }
}
