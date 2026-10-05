import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import Icon from '@/components/ui/Icon';
import InvoiceActionsClient from '@/components/customer/InvoiceActionsClient';
import { connectDB } from '@/lib/db';
import Invoice from '@/lib/models/Invoice';
import Shipment from '@/lib/models/Shipment';
import Payment from '@/lib/models/Payment';
import '@/lib/models/User';
import '@/lib/models/Branch';
import { getCurrentUser } from '@/lib/auth/authorization';
import { ROLES } from '@/lib/constants/roles';
import { formatCurrency } from '@/lib/utils/formatters';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Invoice #${id} | ShipShaft`,
    description: `Official billing invoice and receipt for shipment #${id}.`,
  };
}

export default async function InvoicePage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();

  await connectDB();

  let dbInvoice = null;

  // 1. Try finding by MongoDB ObjectId
  if (mongoose.isValidObjectId(id)) {
    dbInvoice = await Invoice.findById(id)
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

  // 2. Try finding by invoiceNumber
  if (!dbInvoice) {
    dbInvoice = await Invoice.findOne({ invoiceNumber: id.toUpperCase().trim() })
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

  // 3. Try finding by associated shipment tracking number or ID
  if (!dbInvoice) {
    const isObjectId = mongoose.isValidObjectId(id);
    const shipmentQuery = isObjectId
      ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
      : { trackingNumber: id.toUpperCase().trim() };

    const shipment = await Shipment.findOne(shipmentQuery).lean();
    if (shipment) {
      dbInvoice = await Invoice.findOne({ shipmentId: shipment._id })
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

  let invoice = null;

  if (dbInvoice) {
    // RBAC Ownership Check:
    // Customer can only view their own invoice
    const ownerId = dbInvoice.customerId?._id?.toString() || dbInvoice.customerId?.toString();
    if (user && user.role === ROLES.CUSTOMER && ownerId !== user._id.toString()) {
      notFound();
    }

    // Retrieve corresponding payment details
    const shipmentObj = dbInvoice.shipmentId;
    let payment = null;
    if (shipmentObj) {
      payment = await Payment.findOne({
        shipmentId: shipmentObj._id || shipmentObj,
        status: { $in: ['PAID', 'SUCCESS'] },
      }).lean();
    }

    const subtotalFormatted = formatCurrency(dbInvoice.subtotal);
    const taxFormatted = formatCurrency(dbInvoice.tax);
    const totalFormatted = formatCurrency(dbInvoice.total);

    invoice = {
      invoiceNumber: dbInvoice.invoiceNumber,
      date: new Date(dbInvoice.issuedAt || dbInvoice.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      status: 'PAID',
      billTo: {
        company: dbInvoice.customerId?.company || dbInvoice.customerId?.name || 'Registered Customer',
        address1: shipmentObj?.senderAddress || 'Logistics Hub Client',
        address2: shipmentObj?.senderName ? `Attn: ${shipmentObj.senderName}` : '',
        cityStateZip: shipmentObj?.originBranchId
          ? `${shipmentObj.originBranchId.city}, ${shipmentObj.originBranchId.state}`
          : 'India',
        email: dbInvoice.customerId?.email || 'customer@shipshaft.com',
      },
      shipmentId: shipmentObj?.trackingNumber || 'SHP-LOGISTICS',
      serviceLevel: shipmentObj?.serviceType || 'Standard Ground',
      sender: shipmentObj
        ? `${shipmentObj.senderName} (${shipmentObj.originBranchId?.city || 'Origin'})`
        : 'Origin Hub',
      receiver: shipmentObj
        ? `${shipmentObj.receiverName} (${shipmentObj.destinationBranchId?.city || 'Destination'})`
        : 'Destination Hub',
      paymentReference: payment?.transactionId || 'PAY-CONFIRMED',
      paymentMethod: payment?.method || 'SIMULATED',
      lineItems: [
        {
          description: `${shipmentObj?.serviceType || 'Logistics Freight'} Transit Fee`,
          subtitle: `Parcel weight: ${shipmentObj?.weight || 1} kg | Route: ${shipmentObj?.originBranchId?.code || 'ORIG'} to ${shipmentObj?.destinationBranchId?.code || 'DEST'}`,
          qty: '1 unit',
          rate: subtotalFormatted,
          amount: subtotalFormatted,
        },
      ],
      subtotal: subtotalFormatted,
      taxRate: '0% (Standard)',
      tax: taxFormatted,
      totalPaid: totalFormatted,
    };
  } else {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-edge-margin-mobile md:px-edge-margin-desktop py-stack-lg md:py-stack-xl relative z-10">
      {/* Action Bar (Suppressed on Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-stack-lg bg-surface-container-low/80 backdrop-blur-md p-4 rounded-xl border border-outline-variant/30 shadow-sm gap-4 print:hidden">
        <div className="flex items-center gap-2 text-on-surface-variant font-label-md">
          <Icon name="arrow_back" size={18} />
          <Link
            href={`/shipments/${invoice.shipmentId}`}
            className="hover:text-primary transition-colors font-semibold"
          >
            Back to Shipment
          </Link>
        </div>
        <InvoiceActionsClient />
      </div>

      {/* Document Canvas */}
      <div className="glass-panel border border-white/50 rounded-2xl shadow-xl p-6 md:p-12 bg-white/95">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-outline-variant/30 pb-stack-md mb-stack-lg gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                <Icon name="deployed_code" size={18} />
              </div>
              <h1 className="font-headline-lg text-2xl text-primary font-bold tracking-tight">
                ShipShaft
              </h1>
            </div>
            <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-widest font-semibold">
              Precision Logistics Intelligence
            </p>
          </div>

          <div className="text-left md:text-right flex flex-col gap-1.5">
            <h2 className="font-headline-md text-xl text-on-surface font-bold">INVOICE</h2>
            <div className="flex items-center gap-2 md:justify-end text-sm">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold">
                Invoice #
              </span>
              <span className="font-body-md font-mono font-bold text-on-surface">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 md:justify-end text-sm">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold">
                Date
              </span>
              <span className="font-body-md text-on-surface">{invoice.date}</span>
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-success/15 text-tertiary font-label-md text-xs font-bold border border-status-success/30 w-fit md:ml-auto">
              <Icon name="check_circle" size={14} />
              <span>PAID</span>
            </div>
          </div>
        </header>

        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg mb-stack-lg">
          {/* Billing Info */}
          <div>
            <h3 className="font-label-sm text-xs text-on-surface-variant uppercase mb-3 border-b border-outline-variant/20 pb-1 font-bold">
              Bill To
            </h3>
            <div className="font-body-md text-sm text-on-surface flex flex-col gap-1">
              <span className="font-bold text-base">{invoice.billTo.company}</span>
              <span>{invoice.billTo.address1}</span>
              {invoice.billTo.address2 && <span>{invoice.billTo.address2}</span>}
              <span>{invoice.billTo.cityStateZip}</span>
              <span className="text-on-surface-variant mt-1 text-xs">{invoice.billTo.email}</span>
            </div>
          </div>

          {/* Shipment Details Box */}
          <div className="bg-surface-container-low/60 p-4 rounded-xl border border-outline-variant/20">
            <h3 className="font-label-sm text-xs text-on-surface-variant uppercase mb-3 border-b border-outline-variant/20 pb-1 font-bold">
              Shipment Details
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div className="flex flex-col">
                <span className="font-label-sm text-xs text-on-surface-variant">Tracking ID</span>
                <span className="font-body-md font-mono font-bold text-primary">
                  {invoice.shipmentId}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-xs text-on-surface-variant">Service Level</span>
                <span className="font-body-md font-medium text-on-surface">
                  {invoice.serviceLevel}
                </span>
              </div>

              {invoice.paymentReference && (
                <div className="flex flex-col col-span-2 pt-1 border-t border-outline-variant/10">
                  <span className="font-label-sm text-xs text-on-surface-variant">Payment Transaction ID</span>
                  <span className="font-body-md font-mono text-xs font-bold text-on-surface">
                    {invoice.paymentReference} {invoice.paymentMethod ? `(${invoice.paymentMethod})` : ''}
                  </span>
                </div>
              )}

              <div className="col-span-2 mt-1 pt-2 border-t border-outline-variant/20 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-sm text-xs text-on-surface-variant flex items-center gap-1 font-semibold">
                    <Icon name="trip_origin" size={12} className="text-primary" /> Sender
                  </span>
                  <span className="font-body-md text-xs text-on-surface">{invoice.sender}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-sm text-xs text-on-surface-variant flex items-center gap-1 font-semibold">
                    <Icon name="location_on" size={12} className="text-secondary" /> Receiver
                  </span>
                  <span className="font-body-md text-xs text-on-surface">{invoice.receiver}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-stack-lg overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-outline-variant/30 bg-surface-container-low/40">
                <th className="py-3 px-3 font-label-sm text-xs text-on-surface-variant uppercase font-semibold w-1/2">
                  Description
                </th>
                <th className="py-3 px-3 font-label-sm text-xs text-on-surface-variant uppercase font-semibold text-right">
                  Qty / Unit
                </th>
                <th className="py-3 px-3 font-label-sm text-xs text-on-surface-variant uppercase font-semibold text-right">
                  Rate
                </th>
                <th className="py-3 px-3 font-label-sm text-xs text-on-surface-variant uppercase font-semibold text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="font-body-md text-sm">
              {invoice.lineItems.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-outline-variant/15 hover:bg-surface-container-lowest/50 transition-colors"
                >
                  <td className="py-3.5 px-3">
                    <span className="block font-semibold text-on-surface">{item.description}</span>
                    <span className="block text-on-surface-variant text-xs mt-0.5">
                      {item.subtitle}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs">{item.qty}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs">{item.rate}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-on-surface">
                    {item.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-stack-xl">
          <div className="w-full md:w-80 space-y-2">
            <div className="flex justify-between py-1.5 border-b border-outline-variant/15 text-sm text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-on-surface">{invoice.subtotal}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-outline-variant/15 text-sm text-on-surface-variant">
              <span>Tax ({invoice.taxRate})</span>
              <span className="font-mono font-medium text-on-surface">{invoice.tax}</span>
            </div>
            <div className="flex justify-between py-3 border-b-2 border-primary mt-1 font-title-lg text-lg text-primary font-bold">
              <span>Total Paid</span>
              <span className="font-mono">{invoice.totalPaid}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <footer className="text-center font-label-sm text-xs text-outline border-t border-outline-variant/20 pt-6">
          <p className="font-medium text-on-surface-variant">
            Thank you for choosing ShipShaft Precision Logistics.
          </p>
          <p className="mt-1">
            For billing inquiries, contact billing@shipshaft.com or call +1 (800) 555-0199.
          </p>
          <p className="mt-3 text-[11px] opacity-70">
            Generated electronically. This document serves as an official receipt of payment.
          </p>
        </footer>
      </div>
    </div>
  );
}
