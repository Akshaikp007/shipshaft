import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { getCurrentUser } from '@/lib/auth/authorization';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import TrackingEvent from '@/lib/models/TrackingEvent';
import '@/lib/models/Branch';

export const metadata = {
  title: 'Customer Dashboard | ShipShaft',
  description: 'Operational overview and real-time tracking for your logistics shipments.',
};

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  await connectDB();

  // Query ONLY shipments belonging to the authenticated customer
  const customerShipments = await Shipment.find({ customerId: user._id })
    .sort({ createdAt: -1 })
    .populate('originBranchId', 'name code city state')
    .populate('destinationBranchId', 'name code city state')
    .lean();

  const totalCount = customerShipments.length;
  const activeShipments = customerShipments.filter((s) => s.status !== 'DELIVERED');
  const activeCount = activeShipments.length;
  const inTransitCount = customerShipments.filter(
    (s) => s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY'
  ).length;
  const deliveredCount = customerShipments.filter((s) => s.status === 'DELIVERED').length;
  const pendingPaymentCount = customerShipments.filter((s) => s.status === 'BOOKED').length;

  // The active spotlight shipment (most recent non-delivered, or fallback to most recent shipment)
  const spotlightShipment = activeShipments.length > 0 ? activeShipments[0] : customerShipments[0] || null;

  // Fetch real recent tracking events for this customer's consignments
  const shipmentIds = customerShipments.map((s) => s._id);
  let recentActivity = [];
  if (shipmentIds.length > 0) {
    const rawEvents = await TrackingEvent.find({ shipmentId: { $in: shipmentIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'shipmentId', select: 'trackingNumber status' })
      .populate('branchId', 'name city')
      .lean();

    recentActivity = rawEvents.map((ev) => {
      const trackingNum = ev.shipmentId?.trackingNumber || 'Consignment';
      const loc = ev.location || (ev.branchId ? `${ev.branchId.name}, ${ev.branchId.city}` : 'Logistics Hub');
      return {
        id: ev._id.toString(),
        title: `${trackingNum}: ${ev.status.replace(/_/g, ' ')}`,
        subtitle: `${loc} • ${new Date(ev.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        status: ev.status,
      };
    });
  }

  const userFirstName = user.name ? user.name.split(' ')[0] : 'Client';

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold tracking-tight">
            Welcome back, {userFirstName}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Authoritative operational summary for your logistics pipeline.
          </p>
        </div>
        <Link
          href="/shipments/book"
          className="btn-premium bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-primary-container transition-all"
        >
          <Icon name="add_box" size={20} />
          <span>Book Shipment</span>
        </Link>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-md">
        {/* Summary Stats (Top Row: 4 cards across 12 cols) */}
        <div className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-stack-md">
          {/* Stat Card 1: Total Shipments */}
          <div className="glass-panel border border-white/40 rounded-xl p-5 flex flex-col justify-between h-32 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Total Booked
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                <Icon name="inventory_2" size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-headline-lg text-2xl md:text-3xl text-on-surface font-bold">
                {totalCount}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">all time</span>
            </div>
          </div>

          {/* Stat Card 2: Active Shipments */}
          <div className="glass-panel border border-white/40 rounded-xl p-5 flex flex-col justify-between h-32 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Active Deliveries
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="local_shipping" size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-headline-lg text-2xl md:text-3xl text-primary font-bold">
                {activeCount}
              </span>
              <span className="text-xs text-primary font-medium font-mono">
                {inTransitCount} in flight
              </span>
            </div>
          </div>

          {/* Stat Card 3: Delivered */}
          <div className="glass-panel border border-white/40 rounded-xl p-5 flex flex-col justify-between h-32 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Delivered
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-tertiary">
                <Icon name="check_circle" size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-headline-lg text-2xl md:text-3xl text-on-surface font-bold">
                {deliveredCount}
              </span>
              <span className="text-xs text-tertiary font-bold">completed</span>
            </div>
          </div>

          {/* Stat Card 4: Pending Action */}
          <div className="glass-panel border border-white/40 rounded-xl p-5 flex flex-col justify-between h-32 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Awaiting Payment
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary">
                <Icon name="payments" size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-headline-lg text-2xl md:text-3xl text-on-surface font-bold">
                {pendingPaymentCount}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">pending</span>
            </div>
          </div>
        </div>

        {/* Primary Data Area (8 columns on desktop) */}
        <div className="md:col-span-8 flex flex-col gap-stack-md">
          {totalCount === 0 ? (
            <EmptyState
              icon="local_shipping"
              title="No shipments yet."
              description="You have not booked any shipments yet. Get started by creating your first precision logistics shipment."
              actionLabel="Book a Shipment"
              actionHref="/shipments/book"
              className="my-4"
            />
          ) : spotlightShipment ? (
            <div className="glass-panel border border-white/40 rounded-xl p-6 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-start mb-6 flex-wrap gap-2">
                <div>
                  <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold">
                    {spotlightShipment.status === 'DELIVERED' ? 'Recent Consignment' : 'Active Spotlight'}
                  </span>
                  <h2 className="font-headline-md text-xl md:text-2xl text-on-surface font-bold mt-0.5 font-mono">
                    {spotlightShipment.trackingNumber}
                  </h2>
                </div>
                <StatusBadge
                  label={spotlightShipment.status.replace(/_/g, ' ')}
                  variant={
                    spotlightShipment.status === 'DELIVERED'
                      ? 'success'
                      : spotlightShipment.status === 'IN_TRANSIT'
                      ? 'warning'
                      : 'primary'
                  }
                  pulse={spotlightShipment.status === 'IN_TRANSIT' || spotlightShipment.status === 'OUT_FOR_DELIVERY'}
                />
              </div>

              {/* Visual Route Information */}
              <div className="my-6 p-4 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-on-surface-variant uppercase">Origin</div>
                  <div className="font-title-md font-bold text-on-surface text-sm">
                    {spotlightShipment.originBranchId?.city || 'Origin Terminal'}
                  </div>
                  <div className="text-xs text-outline font-mono">
                    {spotlightShipment.originBranchId?.code || spotlightShipment.senderAddress}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold">
                  <span className="hidden sm:inline">─────────</span>
                  <Icon name="arrow_forward" size={16} />
                  <span className="hidden sm:inline">─────────</span>
                </div>

                <div className="sm:text-right">
                  <div className="text-[11px] font-semibold text-on-surface-variant uppercase">Destination</div>
                  <div className="font-title-md font-bold text-on-surface text-sm">
                    {spotlightShipment.destinationBranchId?.city || 'Destination Hub'}
                  </div>
                  <div className="text-xs text-outline font-mono">
                    {spotlightShipment.destinationBranchId?.code || spotlightShipment.receiverAddress}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-center mt-6 border-t border-glass-border pt-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    <Icon name="person" size={18} />
                  </div>
                  <div>
                    <div className="font-label-sm text-[11px] text-on-surface-variant">Recipient</div>
                    <div className="font-label-md text-xs md:text-sm text-on-surface font-semibold">
                      {spotlightShipment.receiverName}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/shipments/${spotlightShipment.trackingNumber}`}
                  className="font-label-md text-xs md:text-sm text-primary font-bold hover:text-primary-container transition-colors flex items-center gap-1.5"
                >
                  <span>Inspect Shipment</span>
                  <Icon name="arrow_forward" size={16} />
                </Link>
              </div>
            </div>
          ) : null}

          {/* Quick Actions Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
            <Link
              href="/shipments"
              className="glass-panel border border-white/40 rounded-xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between h-36 group"
            >
              <div>
                <div className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold mb-1">
                  Full Dispatch Log
                </div>
                <div className="font-title-md font-bold text-on-surface group-hover:text-primary transition-colors">
                  My Shipments
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  View and search all active and historical consignments.
                </p>
              </div>
              <div className="flex items-center text-primary text-xs font-bold group-hover:translate-x-1 transition-transform">
                <span>View Full List</span>
                <Icon name="arrow_forward" size={14} className="ml-1" />
              </div>
            </Link>

            <Link
              href="/shipments/book"
              className="glass-panel border border-white/40 rounded-xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between h-36 group"
            >
              <div>
                <div className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold mb-1">
                  New Consignment
                </div>
                <div className="font-title-md font-bold text-on-surface group-hover:text-primary transition-colors">
                  Book a Shipment
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Calculate weight-based pricing and generate tracking immediately.
                </p>
              </div>
              <div className="flex items-center text-primary text-xs font-bold group-hover:translate-x-1 transition-transform">
                <span>Open Booking Wizard</span>
                <Icon name="add" size={14} className="ml-1" />
              </div>
            </Link>
          </div>
        </div>

        {/* Right Sidebar: Recent Activity (4 columns on desktop) */}
        <div className="md:col-span-4 glass-panel border border-white/40 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-title-lg text-base md:text-lg text-on-surface mb-5 flex items-center gap-2 font-bold">
              <Icon name="history" size={20} className="text-primary" />
              <span>Recent Activity</span>
            </h3>

            {recentActivity.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-xs">
                <Icon name="history" size={24} className="mx-auto text-outline mb-2" />
                <p>No recent activity yet.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[15px] top-3 bottom-3 w-px bg-outline-variant/30"></div>
                <div className="flex flex-col gap-5 relative z-10">
                  {recentActivity.map((act) => (
                    <div key={act.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center ring-4 ring-surface text-primary border border-outline-variant/20">
                        <Icon name="check" size={14} />
                      </div>
                      <div className="pt-0.5">
                        <p className="font-label-md text-xs font-bold text-on-surface">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {act.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/shipments"
            className="w-full mt-6 py-2.5 font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors text-center border-t border-outline-variant/20 block font-semibold"
          >
            View All Shipments
          </Link>
        </div>
      </div>
    </div>
  );
}
