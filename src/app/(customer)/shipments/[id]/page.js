import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import { getCurrentUser } from '@/lib/auth/authorization';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import TrackingEvent from '@/lib/models/TrackingEvent';
import '@/lib/models/Branch';
import { ALL_SHIPMENT_STATUSES } from '@/lib/constants/shipmentStatus';
import { formatCurrency } from '@/lib/utils/formatters';
import DeliveryOtpNotice from '@/components/customer/DeliveryOtpNotice';
import CustomerLiveTrackingMap from '@/components/customer/CustomerLiveTrackingMap';
import QRDisplay from '@/components/domain/QRDisplay';
import { ensureShipmentQrToken, formatQrPayload, generateQrDataUrl } from '@/lib/services/qrService';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Shipment #${id} | ShipShaft`,
    description: `Detailed real-time logistics tracking and telemetry for shipment #${id}.`,
  };
}

export default async function ShipmentDetailsPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();

  await connectDB();

  // Try to find in MongoDB
  const isObjectId = mongoose.isValidObjectId(id);
  const query = isObjectId
    ? { $or: [{ _id: id }, { trackingNumber: id.toUpperCase().trim() }] }
    : { trackingNumber: id.toUpperCase().trim() };

  let dbShipment = await Shipment.findOne(query)
    .populate('customerId', 'name email phone')
    .populate('originBranchId', 'name code city state country address phone')
    .populate('destinationBranchId', 'name code city state country address phone')
    .populate('agentId', 'employeeId vehicleType vehicleNumber')
    .lean();

  if (!dbShipment) {
    notFound();
  }

  // RBAC Ownership Check:
  // If authenticated user is CUSTOMER, must be the owner
  const ownerId = dbShipment.customerId?._id?.toString() || dbShipment.customerId?.toString();
  if (user && user.role === 'CUSTOMER' && ownerId !== user._id.toString()) {
    notFound();
  }

  const dbTrackingEvents = await TrackingEvent.find({ shipmentId: dbShipment._id })
    .sort({ createdAt: 1 })
    .populate('branchId', 'name code city state')
    .lean();

  // Ensure QR token is present (generates and persists if legacy/missing)
  let qrToken = dbShipment?.qrToken || null;
  if (!qrToken && dbShipment._id) {
    qrToken = await ensureShipmentQrToken(dbShipment._id);
  }
  let qrDataUrl = '';
  if (qrToken) {
    qrDataUrl = await generateQrDataUrl(formatQrPayload(qrToken));
  }

  // Authoritative shipment fields directly from DB
  const shipment = {
    id: dbShipment.trackingNumber,
    trackingNumber: dbShipment.trackingNumber,
    status: dbShipment.status,
    statusLabel: dbShipment.status.replace(/_/g, ' '),
    statusVariant:
      dbShipment.status === 'DELIVERED'
        ? 'success'
        : dbShipment.status === 'IN_TRANSIT'
        ? 'warning'
        : dbShipment.status === 'BOOKED'
        ? 'info'
        : 'primary',
    shippingCost: formatCurrency(dbShipment.shippingCost),
    serviceType: dbShipment.serviceType,
    originFull: dbShipment.originBranchId?.name
      ? `${dbShipment.originBranchId.name} (${dbShipment.originBranchId.code})`
      : dbShipment.senderAddress,
    originAddress: dbShipment.originBranchId?.address || dbShipment.senderAddress,
    destinationFull: dbShipment.destinationBranchId?.name
      ? `${dbShipment.destinationBranchId.name} (${dbShipment.destinationBranchId.code})`
      : dbShipment.receiverAddress,
    destinationAddress: dbShipment.destinationBranchId?.address || dbShipment.receiverAddress,
    senderName: dbShipment.senderName,
    senderPhone: dbShipment.senderPhone,
    receiverName: dbShipment.receiverName,
    receiverPhone: dbShipment.receiverPhone,
    packageInfo: {
      category: dbShipment.packageDescription || 'General Freight',
      grossWeight: `${dbShipment.weight} kg`,
      dimensions: `${dbShipment.length || 0} x ${dbShipment.width || 0} x ${dbShipment.height || 0} cm`,
    },
    expectedDeliveryDate: dbShipment.expectedDeliveryDate
      ? new Date(dbShipment.expectedDeliveryDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Pending dispatch',
    createdAtFormatted: new Date(dbShipment.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    currentStatusDetail: {
      headline:
        dbTrackingEvents.length > 0
          ? dbTrackingEvents[dbTrackingEvents.length - 1].description
          : 'Shipment registered and booked',
      timestamp:
        dbTrackingEvents.length > 0
          ? new Date(dbTrackingEvents[dbTrackingEvents.length - 1].createdAt).toLocaleString()
          : new Date(dbShipment.createdAt).toLocaleString(),
    },
    originCity: dbShipment.originBranchId?.city || 'Origin',
    destinationCity: dbShipment.destinationBranchId?.city || 'Destination',
    agent: dbShipment.agentId || null,
  };

  // Build timeline steps dynamically
  const statusOrder = ALL_SHIPMENT_STATUSES;
  const currentStatusIndex = statusOrder.indexOf(shipment.status);

  const timelineSteps = [
    { name: 'Booked', status: currentStatusIndex >= 0 ? (currentStatusIndex === 0 ? 'active' : 'completed') : 'pending' },
    { name: 'Confirmed', status: currentStatusIndex >= 1 ? (currentStatusIndex === 1 ? 'active' : 'completed') : 'pending' },
    { name: 'Assigned', status: currentStatusIndex >= 2 ? (currentStatusIndex === 2 ? 'active' : 'completed') : 'pending' },
    { name: 'Picked Up', status: currentStatusIndex >= 3 ? (currentStatusIndex === 3 ? 'active' : 'completed') : 'pending' },
    { name: 'Origin Hub', status: currentStatusIndex >= 4 ? (currentStatusIndex === 4 ? 'active' : 'completed') : 'pending' },
    { name: 'In Transit', status: currentStatusIndex >= 5 ? (currentStatusIndex === 5 ? 'active' : 'completed') : 'pending' },
    { name: 'Dest Hub', status: currentStatusIndex >= 6 ? (currentStatusIndex === 6 ? 'active' : 'completed') : 'pending' },
    { name: 'Out for Delivery', status: currentStatusIndex >= 7 ? (currentStatusIndex === 7 ? 'active' : 'completed') : 'pending' },
    { name: 'Delivered', status: currentStatusIndex >= 8 ? 'completed' : 'pending' },
  ];

  const progressPercent = Math.max(10, Math.round(((Math.max(0, currentStatusIndex) + 1) / statusOrder.length) * 100));

  return (
    <div className="max-w-[1440px] mx-auto px-edge-margin-mobile md:px-edge-margin-desktop py-stack-lg md:py-stack-xl flex flex-col gap-stack-lg">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <Link
            href="/shipments"
            className="inline-flex items-center gap-2 text-primary font-label-md text-label-md mb-4 hover:underline"
          >
            <Icon name="arrow_back" size={16} />
            <span>Back to Shipments</span>
          </Link>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
              Tracking ID: {shipment.trackingNumber}
            </h1>
            <StatusBadge
              label={shipment.statusLabel}
              variant={shipment.statusVariant}
              pulse={shipment.status === 'IN_TRANSIT' || shipment.status === 'BOOKED'}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {shipment.status === 'BOOKED' ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-warning/15 text-on-surface font-label-md text-xs font-bold border border-status-warning/30">
                <Icon name="pending" size={16} className="text-secondary" />
                <span>Payment Required</span>
              </div>
              <Link
                href={`/payments/${shipment.id}`}
                className="btn-premium px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center gap-2 shadow-md hover:bg-primary-container transition-all"
              >
                <Icon name="payments" size={18} />
                <span>Pay Now</span>
              </Link>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-success/15 text-tertiary font-label-md text-xs font-bold border border-status-success/30">
                <Icon name="check_circle" size={16} />
                <span>Payment Confirmed</span>
              </div>
              <Link
                href={`/invoices/${shipment.id}`}
                className="btn-premium px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center gap-2 shadow-md hover:bg-primary-container transition-all"
              >
                <Icon name="receipt_long" size={18} />
                <span>View Invoice</span>
              </Link>
            </>
          )}
        </div>

      </header>

      {/* Out for Delivery Email OTP Notification Banner */}
      {shipment.status === 'OUT_FOR_DELIVERY' && (
        <DeliveryOtpNotice trackingNumber={shipment.trackingNumber} />
      )}

      {/* Main Grid: Left Details & Timeline, Right Map & QR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-stack-lg">
          {/* Tracking Timeline Card */}
          <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
            <h2 className="font-title-lg text-title-lg text-on-surface mb-8 font-bold">
              Tracking Timeline
            </h2>

            {/* Horizontal Timeline (Desktop/Tablet) */}
            <div className="relative overflow-x-auto pb-6">
              <div className="min-w-[700px] flex items-center justify-between relative">
                {/* Connecting background track */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-outline-variant/30 -z-0"></div>
                {/* Completed track */}
                <div
                  className="absolute top-4 left-6 h-0.5 bg-primary -z-0 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>

                {timelineSteps.map((step, idx) => {
                  if (step.status === 'completed') {
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 w-20 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-md">
                          <Icon name="check" size={16} />
                        </div>
                        <span className="font-label-sm text-xs text-on-surface text-center font-medium">
                          {step.name}
                        </span>
                      </div>
                    );
                  }

                  if (step.status === 'active') {
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 w-24 relative z-10">
                        <div className="relative flex items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-primary opacity-40"></span>
                          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg ring-4 ring-primary-fixed relative z-10">
                            <Icon name="local_shipping" size={20} />
                          </div>
                        </div>
                        <span className="font-label-sm text-xs text-primary font-bold text-center">
                          {step.name}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-20 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center"></div>
                      <span className="font-label-sm text-xs text-outline text-center">
                        {step.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active State Detail Box */}
            <div className="mt-6 p-5 bg-primary/5 rounded-xl border border-primary-fixed/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold mb-1">
                  Current Status Detail
                </div>
                <div className="font-title-lg text-title-lg text-on-surface font-bold">
                  {shipment.currentStatusDetail?.headline}
                </div>
                <div className="font-body-md text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                  <Icon name="schedule" size={16} className="text-on-surface-variant" />
                  <span>{shipment.currentStatusDetail?.timestamp}</span>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="font-body-md text-xs text-on-surface-variant font-medium">
                  Logistics Segment
                </div>
                <div className="font-title-lg text-title-lg text-primary font-bold flex items-center sm:justify-end gap-2 mt-0.5">
                  <span>{shipment.originCity}</span>
                  <Icon name="arrow_forward" size={16} className="text-outline" />
                  <span>{shipment.destinationCity}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Shipment Details Bento */}
          <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
            <h2 className="font-title-lg text-title-lg text-on-surface mb-6 font-bold">
              Shipment Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                    Origin
                  </div>
                  <div className="font-body-md text-body-md text-on-surface font-semibold">
                    {shipment.originFull}
                  </div>
                  <div className="font-body-md text-xs text-on-surface-variant mt-0.5">
                    {shipment.originAddress}
                  </div>
                </div>

                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                    Destination
                  </div>
                  <div className="font-body-md text-body-md text-on-surface font-semibold">
                    {shipment.destinationFull}
                  </div>
                  <div className="font-body-md text-xs text-on-surface-variant mt-0.5">
                    {shipment.destinationAddress}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                    Package Info
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="p-3 bg-surface-container rounded-xl text-primary">
                      <Icon name="inventory_2" size={24} />
                    </div>
                    <div>
                      <div className="font-body-md text-body-md text-on-surface font-semibold">
                        {shipment.packageInfo?.category || 'General Cargo'}
                      </div>
                      <div className="font-body-md text-xs text-on-surface-variant">
                        Service: {shipment.serviceType}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                    Weight & Dimensions
                  </div>
                  <div className="font-body-md text-body-md text-on-surface font-medium">
                    Gross Weight: <span className="font-bold">{shipment.packageInfo?.grossWeight}</span>
                  </div>
                  <div className="font-body-md text-xs text-on-surface-variant mt-0.5">
                    Dimensions: {shipment.packageInfo?.dimensions}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tracking Events History List */}
          {dbTrackingEvents.length > 0 && (
            <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-6 font-bold flex items-center gap-2">
                <Icon name="history" size={20} className="text-primary" />
                <span>Checkpoint History ({dbTrackingEvents.length})</span>
              </h2>

              <div className="space-y-4">
                {dbTrackingEvents.map((evt, idx) => (
                  <div
                    key={evt._id.toString()}
                    className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline flex-wrap gap-2">
                        <p className="font-label-md text-sm font-bold text-on-surface">
                          {evt.status.replace(/_/g, ' ')}
                        </p>
                        <span className="font-label-sm text-xs text-on-surface-variant">
                          {new Date(evt.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{evt.description}</p>
                      {evt.location && (
                        <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                          <Icon name="location_on" size={14} />
                          <span>{evt.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Price & Billing Card */}
          <div className="glass-panel border border-white/40 rounded-xl p-6 shadow-md">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-2">
              Authoritative Shipping Cost
            </div>
            <div className="font-headline-lg text-headline-lg text-primary font-bold">
              {shipment.shippingCost}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Tier: <span className="font-semibold text-on-surface">{shipment.serviceType}</span>
            </p>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex justify-between items-center text-xs">
              <span className="text-on-surface-variant font-medium">Expected Delivery:</span>
              <span className="font-bold text-on-surface">{shipment.expectedDeliveryDate}</span>
            </div>
          </div>

          {/* Live GPS Telemetry Map (Active during OUT_FOR_DELIVERY) or Route Card */}
          {shipment.status === 'OUT_FOR_DELIVERY' ? (
            <CustomerLiveTrackingMap
              trackingNumber={shipment.trackingNumber}
              initialStatus={shipment.status}
            />
          ) : (
            <div className="glass-panel border border-white/40 rounded-xl overflow-hidden h-64 relative group shadow-md flex flex-col justify-end p-5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-surface-container to-surface-tint/10 flex items-center justify-center pointer-events-none">
                <Icon name="map" size={72} className="text-primary/20" />
              </div>
              <div className="relative z-10">
                <div className="font-label-sm text-xs text-primary font-bold uppercase mb-1">
                  Live GPS Telemetry
                </div>
                <p className="font-body-md text-xs text-on-surface-variant mb-3">
                  Tracking telemetry active between {shipment.originCity} and {shipment.destinationCity}.
                </p>
                <button
                  type="button"
                  className="w-full btn-premium bg-primary text-on-primary rounded-xl py-2.5 font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-primary-container transition-all cursor-pointer"
                >
                  <Icon name="explore" size={18} />
                  <span>Live Route Map</span>
                </button>
              </div>
            </div>
          )}

          {/* QR Code Identification Card */}
          <QRDisplay
            qrToken={qrToken}
            trackingNumber={shipment.trackingNumber}
            precomputedDataUrl={qrDataUrl}
          />

          {/* Parties Involved Card */}
          <div className="glass-panel border border-white/40 rounded-xl p-6 shadow-md">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-4">
              Parties Involved
            </div>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-outline-variant/20">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm">
                S
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate">
                  {shipment.senderName}
                </div>
                <div className="font-label-sm text-xs text-on-surface-variant truncate">
                  Sender • {shipment.senderPhone}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-sm">
                R
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate">
                  {shipment.receiverName}
                </div>
                <div className="font-label-sm text-xs text-on-surface-variant truncate">
                  Receiver • {shipment.receiverPhone}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
