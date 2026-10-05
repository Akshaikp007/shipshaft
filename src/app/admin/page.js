import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Branch from '@/lib/models/Branch';
import Agent from '@/lib/models/Agent';
import Payment from '@/lib/models/Payment';
import '@/lib/models/User';
import { formatCurrency } from '@/lib/utils/formatters';

export const metadata = {
  title: 'Command Center | ShipShaft Admin',
  description: 'Enterprise logistics administration, fleet tracking, and network management.',
};

export default async function AdminDashboardPage() {
  await connectDB();

  // 1. Live KPI metrics from MongoDB
  const [totalShipments, activeShipments, deliveredShipments, totalAgents, totalBranches] =
    await Promise.all([
      Shipment.countDocuments(),
      Shipment.countDocuments({
        status: { $in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'ASSIGNED', 'PICKED_UP', 'DESTINATION_HUB'] },
      }),
      Shipment.countDocuments({ status: 'DELIVERED' }),
      Agent.countDocuments(),
      Branch.countDocuments(),
    ]);

  const revenueAgg = await Payment.aggregate([
    { $match: { status: { $in: ['PAID', 'SUCCESS'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  // 2. Hub Capacity & Health
  const rawBranches = await Branch.find().lean();
  const branches = await Promise.all(
    rawBranches.map(async (b) => {
      const [activeCount, agentCount] = await Promise.all([
        Shipment.countDocuments({
          $or: [{ originBranchId: b._id }, { destinationBranchId: b._id }],
          status: { $nin: ['DELIVERED', 'CANCELLED'] },
        }),
        Agent.countDocuments({ branchId: b._id }),
      ]);
      const maxCapacity = 100;
      const usagePercent = Math.min(Math.round((activeCount / maxCapacity) * 100), 100);

      return {
        id: b._id.toString(),
        name: b.name,
        code: b.code,
        city: b.city,
        state: b.state,
        manager: b.manager || 'Operations Lead',
        activeShipments: activeCount,
        totalAgents: agentCount,
        capacityUsage: `${usagePercent}%`,
        usageNumber: usagePercent,
      };
    })
  );

  // 3. Live Recent Shipments Stream
  const rawRecent = await Shipment.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('originBranchId', 'name code city')
    .populate('destinationBranchId', 'name code city')
    .populate({
      path: 'agentId',
      populate: { path: 'userId', select: 'name' },
    })
    .lean();

  const recentShipments = rawRecent.map((s) => ({
    id: s.trackingNumber,
    trackingNumber: s.trackingNumber,
    customerName: s.senderName,
    receiverName: s.receiverName,
    origin: s.originBranchId?.city || 'Origin',
    destination: s.destinationBranchId?.city || 'Destination',
    agentName: s.agentId?.userId?.name || s.agentId?.employeeId || 'Unassigned',
    amount: formatCurrency(s.shippingCost),
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
  }));

  const kpis = [
    {
      title: 'Total Consignments',
      value: totalShipments.toLocaleString(),
      subtitle: `${activeShipments} in operational pipeline`,
      icon: 'local_shipping',
    },
    {
      title: 'Active Pipeline',
      value: activeShipments.toLocaleString(),
      subtitle: 'In-transit & out for delivery',
      icon: 'moving',
    },
    {
      title: 'Delivered Packages',
      value: deliveredShipments.toLocaleString(),
      subtitle: `${totalShipments > 0 ? Math.round((deliveredShipments / totalShipments) * 100) : 0}% completion SLA`,
      icon: 'check_circle',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: 'Settled transit receivables',
      icon: 'payments',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Telemetry Online • Global Command Center</span>
          </div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Logistics Command Center
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
            Real-time monitoring across {totalBranches} operational hubs, {totalAgents} active couriers, and live transit corridors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/shipments">
            <Button variant="primary" size="md" icon={<Icon name="add" size={18} />}>
              Create Shipment
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button variant="secondary" size="md" icon={<Icon name="insights" size={18} />}>
              View Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-outline mb-2">
              <span className="font-label-sm text-xs uppercase font-semibold text-on-surface-variant">
                {kpi.title}
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon name={kpi.icon} size={16} />
              </div>
            </div>
            <div>
              <div className="font-headline-md text-2xl md:text-3xl font-black text-on-surface">
                {kpi.value}
              </div>
              <div className="text-[11px] text-on-surface-variant mt-0.5">{kpi.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Center Section: Hub Operations & Live Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Hub Capacity & Health */}
        <div className="lg:col-span-7 glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div>
              <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <Icon name="warehouse" size={20} className="text-primary" />
                <span>Network Hub Capacity & Health</span>
              </h2>
              <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                Real-time throughput and storage thresholds across key logistics nodes.
              </p>
            </div>
            <Link
              href="/admin/branches"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>All Hubs ({branches.length})</span>
              <Icon name="arrow_forward" size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {branches.length === 0 ? (
              <div className="p-8 text-center text-xs text-on-surface-variant font-medium">
                No branches found.
              </div>
            ) : (
              branches.map((hub) => (
                <div
                  key={hub.id}
                  className="p-3.5 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors border border-outline-variant/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-label-md text-xs font-bold text-on-surface block">
                        {hub.name} ({hub.code})
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {hub.city}, {hub.state} • Manager: {hub.manager}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-primary block">
                        {hub.capacityUsage} Capacity
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {hub.activeShipments} Active / {hub.totalAgents} Agents
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-outline-variant/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hub.usageNumber > 80 ? 'bg-error' : 'bg-primary'
                      }`}
                      style={{ width: hub.capacityUsage }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Management Links / Shortcuts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-4">
            <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <Icon name="bolt" size={20} className="text-primary" />
              <span>Operational Shortcuts</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/admin/shipments"
                className="p-3.5 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 hover:bg-surface-container hover:border-primary/40 transition-all flex flex-col gap-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="local_shipping" size={18} />
                </div>
                <div>
                  <span className="font-label-md text-xs font-bold text-on-surface block">
                    Shipments
                  </span>
                  <span className="text-[10px] text-on-surface-variant">View all orders</span>
                </div>
              </Link>

              <Link
                href="/admin/agents"
                className="p-3.5 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 hover:bg-surface-container hover:border-primary/40 transition-all flex flex-col gap-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="group" size={18} />
                </div>
                <div>
                  <span className="font-label-md text-xs font-bold text-on-surface block">
                    Fleet Dispatch
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Manage agents</span>
                </div>
              </Link>

              <Link
                href="/admin/branches"
                className="p-3.5 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 hover:bg-surface-container hover:border-primary/40 transition-all flex flex-col gap-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="warehouse" size={18} />
                </div>
                <div>
                  <span className="font-label-md text-xs font-bold text-on-surface block">
                    Hub Terminals
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Network routes</span>
                </div>
              </Link>

              <Link
                href="/admin/reports"
                className="p-3.5 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 hover:bg-surface-container hover:border-primary/40 transition-all flex flex-col gap-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="insights" size={18} />
                </div>
                <div>
                  <span className="font-label-md text-xs font-bold text-on-surface block">
                    Analytics
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Financial SLA</span>
                </div>
              </Link>
            </div>
          </div>

          {/* System Telemetry Status Box */}
          <div className="glass-panel border border-tertiary/30 rounded-3xl p-5 bg-tertiary/5 space-y-2">
            <div className="flex items-center gap-2 text-tertiary font-bold text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span>Telemetry Satellite Link</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              GPS telemetry ingestion online. 99.98% gateway sync rate with zero packet drops in the last 24h.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Shipments Stream Table */}
      <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div>
            <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
              <Icon name="schedule" size={20} className="text-primary" />
              <span>Live Shipment Logistics Stream</span>
            </h2>
            <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
              Latest consignments processed through the global distribution network.
            </p>
          </div>
          <Link href="/admin/shipments">
            <Button variant="secondary" size="sm" icon={<Icon name="arrow_forward" size={16} />}>
              Manage All Shipments
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant font-label-md uppercase tracking-wider bg-surface-container-low/40">
                <th className="py-3 px-3">Tracking ID</th>
                <th className="py-3 px-3">Customer / Shipper</th>
                <th className="py-3 px-3">Route (Origin → Dest)</th>
                <th className="py-3 px-3">Agent</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {recentShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-on-surface-variant font-medium">
                    No shipments found.
                  </td>
                </tr>
              ) : (
                recentShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-primary">
                      {s.trackingNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-on-surface block">
                        {s.customerName}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        To: {s.receiverName}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-on-surface">
                        {s.origin} → {s.destination}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-on-surface">
                      {s.agentName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-on-surface">
                      {s.amount}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge
                        label={s.statusLabel}
                        variant={s.statusVariant}
                        pulse={s.status === 'IN_TRANSIT'}
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/shipments/${s.id}`}
                        className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <Icon name="chevron_right" size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
