import mongoose from 'mongoose';
import Shipment from '../models/Shipment.js';
import Payment from '../models/Payment.js';
import Agent from '../models/Agent.js';
import Branch from '../models/Branch.js';
import AgentLocation from '../models/AgentLocation.js';
import { SHIPMENT_STATUS, ALL_SHIPMENT_STATUSES } from '../constants/shipmentStatus.js';
import { PAYMENT_STATUS } from '../constants/paymentStatus.js';

export const MAX_REPORT_RANGE_DAYS = 365;
export const STALE_GPS_THRESHOLD_MS = 60 * 1000; // 60 seconds

export class ReportValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReportValidationError';
    this.statusCode = 400;
  }
}

/**
 * Validates and normalizes date range parameters server-side.
 * Timezone assumption: All date comparisons and time-series buckets are normalized to UTC.
 *
 * @param {Object} params
 * @param {string} [params.range] - 'today', '7d', '30d', 'this_month', 'custom'
 * @param {string} [params.from] - ISO date string
 * @param {string} [params.to] - ISO date string
 * @returns {{ startDate: Date, endDate: Date, filters: Object }}
 */
export function parseDateFilter({ range, from, to } = {}) {
  const now = new Date();
  let startDate;
  let endDate = new Date(now);

  const normalizedRange = (range || '').toLowerCase().trim();

  if (normalizedRange === 'today') {
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  } else if (normalizedRange === '7d' || normalizedRange === 'last_7_days' || normalizedRange === '7_days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (normalizedRange === '30d' || normalizedRange === 'last_30_days' || normalizedRange === '30_days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (normalizedRange === 'this_month' || normalizedRange === 'month') {
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  } else if (normalizedRange === 'custom' || (from && to)) {
    if (!from || !to) {
      throw new ReportValidationError("Invalid custom date range: Both 'from' and 'to' parameters are required.");
    }
    startDate = new Date(from);
    endDate = new Date(to);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ReportValidationError("Invalid date format: 'from' and 'to' must be valid date strings.");
    }
    if (startDate > endDate) {
      throw new ReportValidationError("Invalid date range: 'from' date must be earlier than or equal to 'to' date.");
    }
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs > MAX_REPORT_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      throw new ReportValidationError(`Date range exceeds maximum allowed limit of ${MAX_REPORT_RANGE_DAYS} days.`);
    }
  } else if (from && !to) {
    throw new ReportValidationError("Missing 'to' date for custom range.");
  } else if (!from && to) {
    throw new ReportValidationError("Missing 'from' date for custom range.");
  } else {
    // Default to last 30 days
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate,
    endDate,
    filters: {
      range: normalizedRange || '30d',
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      timezone: 'UTC',
    },
  };
}

/**
 * 1. Admin Overview Report
 * Computes authoritative database totals for Shipments, Revenue, Operations, and Branches.
 */
export async function getOverviewReport(dateParams = {}) {
  const { startDate, endDate, filters } = parseDateFilter(dateParams);
  const now = new Date();

  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

  // Shipments Metrics
  const [
    totalShipments,
    shipmentsToday,
    shipmentsThisMonth,
    deliveredShipments,
    activeShipments,
    pendingShipments,
  ] = await Promise.all([
    Shipment.countDocuments(),
    Shipment.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } }),
    Shipment.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Shipment.countDocuments({ status: SHIPMENT_STATUS.DELIVERED }),
    Shipment.countDocuments({
      status: {
        $in: [
          SHIPMENT_STATUS.PICKED_UP,
          SHIPMENT_STATUS.ORIGIN_HUB,
          SHIPMENT_STATUS.IN_TRANSIT,
          SHIPMENT_STATUS.DESTINATION_HUB,
          SHIPMENT_STATUS.OUT_FOR_DELIVERY,
        ],
      },
    }),
    Shipment.countDocuments({
      status: {
        $in: [SHIPMENT_STATUS.BOOKED, SHIPMENT_STATUS.PAYMENT_CONFIRMED, SHIPMENT_STATUS.ASSIGNED],
      },
    }),
  ]);

  // Revenue Metrics (Only successful/PAID payments count)
  const [revenueTotalAgg, revenueTodayAgg, revenueMonthAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: PAYMENT_STATUS.PAID,
          $or: [
            { paidAt: { $gte: startOfToday, $lte: endOfToday } },
            { paidAt: null, createdAt: { $gte: startOfToday, $lte: endOfToday } },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: PAYMENT_STATUS.PAID,
          $or: [
            { paidAt: { $gte: startOfMonth } },
            { paidAt: null, createdAt: { $gte: startOfMonth } },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const totalRevenue = revenueTotalAgg[0]?.total || 0;
  const revenueToday = revenueTodayAgg[0]?.total || 0;
  const revenueThisMonth = revenueMonthAgg[0]?.total || 0;
  const paidPaymentsCount = revenueTotalAgg[0]?.count || 0;

  // Operations & Agent Metrics
  const [totalAgents, availableAgents, busyAgents, offlineAgents] = await Promise.all([
    Agent.countDocuments(),
    Agent.countDocuments({ availability: 'AVAILABLE', status: { $ne: 'OFFLINE' } }),
    Agent.countDocuments({ availability: 'BUSY' }),
    Agent.countDocuments({
      $or: [{ availability: 'OFFLINE' }, { status: 'OFFLINE' }, { isAvailable: false }],
    }),
  ]);

  // Branch Metrics
  const [totalBranches, activeBranches] = await Promise.all([
    Branch.countDocuments(),
    Branch.countDocuments({ isActive: true }),
  ]);

  return {
    success: true,
    data: {
      shipments: {
        total: totalShipments,
        today: shipmentsToday,
        thisMonth: shipmentsThisMonth,
        delivered: deliveredShipments,
        active: activeShipments,
        pending: pendingShipments,
      },
      revenue: {
        total: totalRevenue,
        today: revenueToday,
        thisMonth: revenueThisMonth,
        paymentCount: paidPaymentsCount,
        currency: 'INR',
      },
      operations: {
        totalAgents,
        availableAgents,
        busyAgents,
        offlineAgents,
      },
      branches: {
        total: totalBranches,
        active: activeBranches,
      },
    },
    filters,
  };
}

/**
 * 2. Shipment Status & Trend Report
 * Aggregates status distribution and time-series volume.
 */
export async function getShipmentReport(dateParams = {}) {
  const { startDate, endDate, filters } = parseDateFilter(dateParams);

  // Status Distribution via Aggregation
  const statusAgg = await Shipment.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusMap = {};
  for (const s of statusAgg) {
    statusMap[s._id] = s.count;
  }

  const distribution = ALL_SHIPMENT_STATUSES.map((statusKey) => ({
    status: statusKey,
    count: statusMap[statusKey] || 0,
  }));

  const totalInPeriod = distribution.reduce((sum, item) => sum + item.count, 0);

  // Time-Series Trend Aggregation grouped by date (YYYY-MM-DD UTC)
  const trendAgg = await Shipment.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const trend = trendAgg.map((item) => ({
    date: item._id,
    count: item.count,
  }));

  return {
    success: true,
    data: {
      total: totalInPeriod,
      distribution,
      trend,
    },
    filters,
  };
}

/**
 * 3. Revenue Analytics Report
 * Authoritative financial aggregation based strictly on PAID payments.
 */
export async function getRevenueReport(dateParams = {}) {
  const { startDate, endDate, filters } = parseDateFilter(dateParams);

  const matchFilter = {
    status: PAYMENT_STATUS.PAID,
    $or: [
      { paidAt: { $gte: startDate, $lte: endDate } },
      { paidAt: null, createdAt: { $gte: startDate, $lte: endDate } },
    ],
  };

  // Overall financial summary for selected range
  const summaryAgg = await Payment.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        paymentCount: { $sum: 1 },
        averagePayment: { $avg: '$amount' },
      },
    },
  ]);

  const totalRevenue = summaryAgg[0]?.totalRevenue || 0;
  const paymentCount = summaryAgg[0]?.paymentCount || 0;
  const averagePayment = summaryAgg[0]?.averagePayment ? Math.round(summaryAgg[0].averagePayment * 100) / 100 : 0;

  // Revenue Trend Time-Series (grouped by date)
  const trendAgg = await Payment.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: { $ifNull: ['$paidAt', '$createdAt'] },
            timezone: 'UTC',
          },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const trend = trendAgg.map((item) => ({
    date: item._id,
    revenue: item.revenue,
    count: item.count,
  }));

  // Revenue by Service Type via $lookup to Shipment
  const serviceTypeAgg = await Payment.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: 'shipments',
        localField: 'shipmentId',
        foreignField: '_id',
        as: 'shipment',
      },
    },
    { $unwind: { path: '$shipment', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$shipment.serviceType', 'Standard Express'] },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const byServiceType = serviceTypeAgg.map((item) => ({
    serviceType: item._id,
    revenue: item.revenue,
    count: item.count,
  }));

  return {
    success: true,
    data: {
      totalRevenue,
      paymentCount,
      averagePayment,
      currency: 'INR',
      trend,
      byServiceType,
    },
    filters,
  };
}

/**
 * 4. Branch Performance Matrix Report
 * Calculates origin/destination shipments, active volume, delivered volume, and revenue.
 */
export async function getBranchReport(dateParams = {}) {
  const { startDate, endDate, filters } = parseDateFilter(dateParams);

  const branches = await Branch.find().sort({ code: 1 }).lean();

  // Aggregate Origin Shipments & Attribution in range
  const originAgg = await Shipment.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$originBranchId',
        originCount: { $sum: 1 },
        totalShippingCost: { $sum: '$shippingCost' },
      },
    },
  ]);
  const originMap = {};
  for (const o of originAgg) {
    if (o._id) originMap[o._id.toString()] = o;
  }

  // Aggregate Destination Shipments in range
  const destAgg = await Shipment.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$destinationBranchId',
        destCount: { $sum: 1 },
      },
    },
  ]);
  const destMap = {};
  for (const d of destAgg) {
    if (d._id) destMap[d._id.toString()] = d.destCount;
  }

  // Aggregate Delivered Shipments
  const deliveredAgg = await Shipment.aggregate([
    {
      $match: {
        status: SHIPMENT_STATUS.DELIVERED,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$destinationBranchId',
        deliveredCount: { $sum: 1 },
      },
    },
  ]);
  const deliveredMap = {};
  for (const d of deliveredAgg) {
    if (d._id) deliveredMap[d._id.toString()] = d.deliveredCount;
  }

  // Aggregate Current Active Shipments (unbounded by date, represents operational workload)
  const activeAgg = await Shipment.aggregate([
    {
      $match: {
        status: {
          $in: [
            SHIPMENT_STATUS.ASSIGNED,
            SHIPMENT_STATUS.PICKED_UP,
            SHIPMENT_STATUS.ORIGIN_HUB,
            SHIPMENT_STATUS.IN_TRANSIT,
            SHIPMENT_STATUS.DESTINATION_HUB,
            SHIPMENT_STATUS.OUT_FOR_DELIVERY,
          ],
        },
      },
    },
    {
      $group: {
        _id: '$originBranchId',
        activeCount: { $sum: 1 },
      },
    },
  ]);
  const activeMap = {};
  for (const a of activeAgg) {
    if (a._id) activeMap[a._id.toString()] = a.activeCount;
  }

  // Aggregate Revenue attributable to branch origin
  const revenueAgg = await Payment.aggregate([
    {
      $match: {
        status: PAYMENT_STATUS.PAID,
        $or: [
          { paidAt: { $gte: startDate, $lte: endDate } },
          { paidAt: null, createdAt: { $gte: startDate, $lte: endDate } },
        ],
      },
    },
    {
      $lookup: {
        from: 'shipments',
        localField: 'shipmentId',
        foreignField: '_id',
        as: 'shipment',
      },
    },
    { $unwind: { path: '$shipment', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$shipment.originBranchId',
        revenue: { $sum: '$amount' },
      },
    },
  ]);
  const revenueMap = {};
  for (const r of revenueAgg) {
    if (r._id) revenueMap[r._id.toString()] = r.revenue;
  }

  const branchMetrics = branches.map((b) => {
    const bId = b._id.toString();
    return {
      branchId: bId,
      branchName: b.name,
      branchCode: b.code,
      city: b.city,
      state: b.state,
      isActive: b.isActive,
      originShipments: originMap[bId]?.originCount || 0,
      destinationShipments: destMap[bId] || 0,
      deliveredShipments: deliveredMap[bId] || 0,
      activeShipments: activeMap[bId] || 0,
      revenue: revenueMap[bId] || 0,
    };
  });

  return {
    success: true,
    data: {
      branches: branchMetrics,
      count: branchMetrics.length,
    },
    filters,
  };
}

/**
 * 5. Agent Operational Performance Report
 * Analyzes shipment distribution across agents, workload, and availability.
 */
export async function getAgentReport(dateParams = {}) {
  const { startDate, endDate, filters } = parseDateFilter(dateParams);

  const agents = await Agent.find()
    .populate('userId', 'name email phone avatar isActive')
    .populate('branchId', 'name code city')
    .sort({ employeeId: 1 })
    .lean();

  // Aggregate agent shipment statuses in the selected date range
  const agentShipmentsAgg = await Shipment.aggregate([
    {
      $match: {
        agentId: { $ne: null },
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { agentId: '$agentId', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const agentStatsMap = {};
  for (const row of agentShipmentsAgg) {
    const aId = row._id.agentId.toString();
    if (!agentStatsMap[aId]) {
      agentStatsMap[aId] = {
        totalAssigned: 0,
        assigned: 0,
        pickedUp: 0,
        inTransit: 0,
        outForDelivery: 0,
        delivered: 0,
      };
    }
    agentStatsMap[aId].totalAssigned += row.count;
    if (row._id.status === SHIPMENT_STATUS.ASSIGNED) agentStatsMap[aId].assigned += row.count;
    if (row._id.status === SHIPMENT_STATUS.PICKED_UP) agentStatsMap[aId].pickedUp += row.count;
    if (row._id.status === SHIPMENT_STATUS.IN_TRANSIT) agentStatsMap[aId].inTransit += row.count;
    if (row._id.status === SHIPMENT_STATUS.OUT_FOR_DELIVERY) agentStatsMap[aId].outForDelivery += row.count;
    if (row._id.status === SHIPMENT_STATUS.DELIVERED) agentStatsMap[aId].delivered += row.count;
  }

  // Active workload aggregation (current active shipments in flight)
  const workloadAgg = await Shipment.aggregate([
    {
      $match: {
        agentId: { $ne: null },
        status: {
          $in: [
            SHIPMENT_STATUS.ASSIGNED,
            SHIPMENT_STATUS.PICKED_UP,
            SHIPMENT_STATUS.ORIGIN_HUB,
            SHIPMENT_STATUS.IN_TRANSIT,
            SHIPMENT_STATUS.DESTINATION_HUB,
            SHIPMENT_STATUS.OUT_FOR_DELIVERY,
          ],
        },
      },
    },
    {
      $group: {
        _id: '$agentId',
        currentWorkload: { $sum: 1 },
      },
    },
  ]);
  const workloadMap = {};
  for (const w of workloadAgg) {
    workloadMap[w._id.toString()] = w.currentWorkload;
  }

  const agentMetrics = agents.map((agent) => {
    const aId = agent._id.toString();
    const stats = agentStatsMap[aId] || {
      totalAssigned: 0,
      assigned: 0,
      pickedUp: 0,
      inTransit: 0,
      outForDelivery: 0,
      delivered: 0,
    };

    return {
      agentId: aId,
      employeeId: agent.employeeId,
      name: agent.userId?.name || 'Unknown Agent',
      branch: agent.branchId ? `${agent.branchId.name} (${agent.branchId.code})` : 'Unassigned',
      availability: agent.availability || (agent.isAvailable ? 'AVAILABLE' : 'OFFLINE'),
      status: agent.status,
      vehicleType: agent.vehicleType,
      totalAssigned: stats.totalAssigned,
      pickedUp: stats.pickedUp,
      inTransit: stats.inTransit,
      outForDelivery: stats.outForDelivery,
      delivered: stats.delivered,
      currentWorkload: workloadMap[aId] || 0,
    };
  });

  return {
    success: true,
    data: {
      agents: agentMetrics,
      count: agentMetrics.length,
    },
    filters,
  };
}

/**
 * 6. GPS / Telemetry Operations Report
 * Aggregates live delivery counts, fresh/stale telemetry ratios, and active transmitting agents.
 * NOTE: Strict Privacy Rule — Does NOT expose precise GPS coordinates in aggregate reports.
 */
export async function getGpsReport() {
  const now = Date.now();
  const freshThreshold = new Date(now - STALE_GPS_THRESHOLD_MS); // 60 seconds ago
  const activeWindow = new Date(now - 5 * 60 * 1000); // 5 minutes ago

  // 1. Shipments currently OUT_FOR_DELIVERY
  const outForDeliveryShipments = await Shipment.find(
    { status: SHIPMENT_STATUS.OUT_FOR_DELIVERY },
    '_id trackingNumber agentId'
  ).lean();

  const outForDeliveryCount = outForDeliveryShipments.length;
  const shipmentIds = outForDeliveryShipments.map((s) => s._id);

  let freshTelemetryCount = 0;
  let staleTelemetryCount = 0;

  if (shipmentIds.length > 0) {
    // Find latest location point for each OUT_FOR_DELIVERY shipment
    const latestLocations = await AgentLocation.aggregate([
      { $match: { shipmentId: { $in: shipmentIds } } },
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: '$shipmentId',
          latestRecordedAt: { $first: '$recordedAt' },
        },
      },
    ]);

    const latestLocationMap = new Map();
    for (const loc of latestLocations) {
      latestLocationMap.set(loc._id.toString(), new Date(loc.latestRecordedAt));
    }

    for (const shp of outForDeliveryShipments) {
      const recTime = latestLocationMap.get(shp._id.toString());
      if (recTime && recTime >= freshThreshold) {
        freshTelemetryCount++;
      } else {
        staleTelemetryCount++;
      }
    }
  }

  // 2. Agents currently transmitting location (recorded in the last 5 minutes)
  const transmittingAgentsAgg = await AgentLocation.aggregate([
    { $match: { recordedAt: { $gte: activeWindow } } },
    { $group: { _id: '$agentId' } },
  ]);
  const agentsTransmittingCount = transmittingAgentsAgg.length;

  // 3. Most recent location update timestamp
  const mostRecent = await AgentLocation.findOne()
    .sort({ recordedAt: -1 })
    .select('recordedAt -_id')
    .lean();

  return {
    success: true,
    data: {
      outForDeliveryCount,
      freshTelemetryCount,
      staleTelemetryCount,
      agentsTransmittingCount,
      staleThresholdSeconds: STALE_GPS_THRESHOLD_MS / 1000,
      lastLocationUpdate: mostRecent ? mostRecent.recordedAt : null,
    },
  };
}
