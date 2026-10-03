import mongoose from 'mongoose';
import AgentLocation from '../models/AgentLocation.js';
import Shipment from '../models/Shipment.js';
import Agent from '../models/Agent.js';
import { SHIPMENT_STATUS } from '../constants/shipmentStatus.js';
import { ROLES } from '../constants/roles.js';

export const LOCATION_STALE_THRESHOLD_MS = 60 * 1000; // 60 seconds
export const MAX_LOCATION_HISTORY_LIMIT = 100;

/**
 * Record a real-time GPS telemetry point for an active delivery.
 * Only the assigned delivery agent can record coordinates for their OUT_FOR_DELIVERY shipment.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.shipmentId
 * @param {Object} params.agentUser - Authenticated user with role AGENT
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {number} [params.accuracy]
 * @param {Date|string|number} [params.recordedAt]
 * @returns {Promise<{ success: boolean, statusCode: number, location?: Object, error?: string }>}
 */
export async function recordAgentLocation({
  shipmentId,
  agentUser,
  latitude,
  longitude,
  accuracy = null,
  recordedAt,
}) {
  if (!agentUser) {
    return {
      success: false,
      statusCode: 401,
      error: 'Authentication required to submit location telemetry.',
    };
  }

  if (agentUser.role !== ROLES.AGENT) {
    return {
      success: false,
      statusCode: 403,
      error: 'Forbidden: Only authorized delivery agents can submit GPS updates.',
    };
  }

  // Coordinate Validation
  if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
    return {
      success: false,
      statusCode: 400,
      error: 'Invalid latitude. Must be a numeric value between -90 and 90.',
    };
  }

  if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
    return {
      success: false,
      statusCode: 400,
      error: 'Invalid longitude. Must be a numeric value between -180 and 180.',
    };
  }

  if (accuracy !== null && accuracy !== undefined) {
    if (typeof accuracy !== 'number' || isNaN(accuracy) || accuracy < 0) {
      return {
        success: false,
        statusCode: 400,
        error: 'Invalid accuracy. Must be a non-negative numeric value.',
      };
    }
  }

  // Timestamp Validation
  let timestamp = new Date();
  if (recordedAt) {
    const candidateDate = new Date(recordedAt);
    if (isNaN(candidateDate.getTime())) {
      return {
        success: false,
        statusCode: 400,
        error: 'Invalid timestamp provided for location recording.',
      };
    }
    // Reject unreasonable future timestamps (> 5 minutes in future)
    if (candidateDate.getTime() > Date.now() + 5 * 60 * 1000) {
      return {
        success: false,
        statusCode: 400,
        error: 'Recorded timestamp cannot be in the future.',
      };
    }
    timestamp = candidateDate;
  }

  // Resolve Agent profile
  const agentProfile = await Agent.findOne({ userId: agentUser._id });
  if (!agentProfile) {
    return {
      success: false,
      statusCode: 404,
      error: 'Delivery agent profile not found.',
    };
  }

  // Find Shipment
  const isObjectId = mongoose.isValidObjectId(shipmentId);
  const query = isObjectId
    ? { $or: [{ _id: shipmentId }, { trackingNumber: shipmentId.toString().toUpperCase().trim() }] }
    : { trackingNumber: shipmentId.toString().toUpperCase().trim() };

  const shipment = await Shipment.findOne(query);
  if (!shipment) {
    return {
      success: false,
      statusCode: 404,
      error: 'Shipment record not found.',
    };
  }

  // Verify Agent Assignment
  const assignedAgentId = shipment.agentId?.toString();
  if (!assignedAgentId || assignedAgentId !== agentProfile._id.toString()) {
    return {
      success: false,
      statusCode: 403,
      error: 'Forbidden: You are not the assigned agent for this shipment.',
    };
  }

  // Verify Shipment Status: MUST be OUT_FOR_DELIVERY
  if (shipment.status !== SHIPMENT_STATUS.OUT_FOR_DELIVERY) {
    return {
      success: false,
      statusCode: 400,
      error: `GPS tracking is only permitted when the shipment is OUT_FOR_DELIVERY. Current status is ${shipment.status}.`,
    };
  }

  // Create telemetry record
  const locationRecord = await AgentLocation.create({
    shipmentId: shipment._id,
    agentId: agentProfile._id,
    latitude,
    longitude,
    accuracy: typeof accuracy === 'number' ? accuracy : null,
    recordedAt: timestamp,
  });

  return {
    success: true,
    statusCode: 201,
    location: {
      latitude: locationRecord.latitude,
      longitude: locationRecord.longitude,
      accuracy: locationRecord.accuracy,
      recordedAt: locationRecord.recordedAt,
      trackingActive: true,
    },
  };
}

/**
 * Helper to authenticate and authorize read access to shipment location telemetry.
 *
 * @param {string|mongoose.Types.ObjectId} shipmentId
 * @param {Object} user - Authenticated user
 * @returns {Promise<{ shipment?: Object, error?: string, statusCode?: number }>}
 */
async function authorizeLocationAccess(shipmentId, user) {
  if (!user) {
    return {
      statusCode: 401,
      error: 'Authentication required to view shipment location.',
    };
  }

  const isObjectId = mongoose.isValidObjectId(shipmentId);
  const query = isObjectId
    ? { $or: [{ _id: shipmentId }, { trackingNumber: shipmentId.toString().toUpperCase().trim() }] }
    : { trackingNumber: shipmentId.toString().toUpperCase().trim() };

  const shipment = await Shipment.findOne(query);
  if (!shipment) {
    return {
      statusCode: 404,
      error: 'Shipment record not found.',
    };
  }

  // Customer ownership check
  if (user.role === ROLES.CUSTOMER) {
    const ownerId = shipment.customerId?.toString();
    if (ownerId !== user._id.toString()) {
      return {
        statusCode: 403,
        error: 'Forbidden: You can only view location telemetry for your own shipments.',
      };
    }
  } else if (user.role === ROLES.AGENT) {
    const agentProfile = await Agent.findOne({ userId: user._id });
    const assignedAgentId = shipment.agentId?.toString();
    if (!agentProfile || !assignedAgentId || assignedAgentId !== agentProfile._id.toString()) {
      return {
        statusCode: 403,
        error: 'Forbidden: You can only view location telemetry for shipments assigned to you.',
      };
    }
  } else if (user.role !== ROLES.ADMIN) {
    return {
      statusCode: 403,
      error: 'Forbidden: Unauthorized access to location telemetry.',
    };
  }

  return { shipment };
}

/**
 * Retrieve the latest location telemetry for a shipment.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.shipmentId
 * @param {Object} params.user - Authenticated user
 * @returns {Promise<{ success: boolean, statusCode: number, location?: Object, trackingActive?: boolean, locationFresh?: boolean, error?: string }>}
 */
export async function getLatestShipmentLocation({ shipmentId, user }) {
  const authResult = await authorizeLocationAccess(shipmentId, user);
  if (authResult.error) {
    return {
      success: false,
      statusCode: authResult.statusCode,
      error: authResult.error,
    };
  }

  const { shipment } = authResult;

  // Retrieve the latest location point using index seek
  const latest = await AgentLocation.findOne({ shipmentId: shipment._id })
    .sort({ recordedAt: -1 })
    .lean();

  const trackingActive = shipment.status === SHIPMENT_STATUS.OUT_FOR_DELIVERY;
  const now = Date.now();
  const locationFresh =
    latest && (now - new Date(latest.recordedAt).getTime()) <= LOCATION_STALE_THRESHOLD_MS;

  return {
    success: true,
    statusCode: 200,
    trackingActive,
    locationFresh: Boolean(locationFresh),
    shipmentStatus: shipment.status,
    location: latest
      ? {
          latitude: latest.latitude,
          longitude: latest.longitude,
          accuracy: latest.accuracy,
          recordedAt: latest.recordedAt,
        }
      : null,
  };
}

/**
 * Retrieve historical location telemetry for a shipment.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.shipmentId
 * @param {Object} params.user - Authenticated user
 * @param {number|string} [params.limit=50]
 * @returns {Promise<{ success: boolean, statusCode: number, history?: Array, count?: number, error?: string }>}
 */
export async function getShipmentLocationHistory({ shipmentId, user, limit = 50 }) {
  const authResult = await authorizeLocationAccess(shipmentId, user);
  if (authResult.error) {
    return {
      success: false,
      statusCode: authResult.statusCode,
      error: authResult.error,
    };
  }

  const { shipment } = authResult;
  const parsedLimit = parseInt(limit, 10);
  const safeLimit = Math.max(
    1,
    Math.min(isNaN(parsedLimit) ? 50 : parsedLimit, MAX_LOCATION_HISTORY_LIMIT)
  );

  const history = await AgentLocation.find({ shipmentId: shipment._id })
    .sort({ recordedAt: 1 })
    .limit(safeLimit)
    .select('latitude longitude accuracy recordedAt -_id')
    .lean();

  return {
    success: true,
    statusCode: 200,
    count: history.length,
    history,
  };
}
