import mongoose from 'mongoose';
import Shipment from '@/lib/models/Shipment';
import TrackingEvent from '@/lib/models/TrackingEvent';
import Notification from '@/lib/models/Notification';
import { SHIPMENT_STATUS } from '@/lib/constants/shipmentStatus';
import { transitionToOutForDelivery } from './otpService';

/**
 * Strict forward state machine map for ShipShaft deliveries.
 * OUT_FOR_DELIVERY -> DELIVERED is intentionally EMPTY here:
 * it can only be achieved via verifyDeliveryOtp.
 */
export const ALLOWED_STATUS_ADVANCEMENTS = Object.freeze({
  [SHIPMENT_STATUS.BOOKED]: [SHIPMENT_STATUS.PAYMENT_CONFIRMED],
  [SHIPMENT_STATUS.PAYMENT_CONFIRMED]: [SHIPMENT_STATUS.ASSIGNED],
  [SHIPMENT_STATUS.ASSIGNED]: [SHIPMENT_STATUS.PICKED_UP],
  [SHIPMENT_STATUS.PICKED_UP]: [SHIPMENT_STATUS.IN_TRANSIT],
  [SHIPMENT_STATUS.IN_TRANSIT]: [SHIPMENT_STATUS.DESTINATION_HUB],
  [SHIPMENT_STATUS.DESTINATION_HUB]: [SHIPMENT_STATUS.OUT_FOR_DELIVERY],
  [SHIPMENT_STATUS.OUT_FOR_DELIVERY]: [], // Terminal via generic API; requires verifyDeliveryOtp
  [SHIPMENT_STATUS.DELIVERED]: [], // Strict terminal state
});

const STATUS_DESCRIPTIONS = {
  [SHIPMENT_STATUS.PICKED_UP]: 'Package collected from sender premises by assigned courier.',
  [SHIPMENT_STATUS.IN_TRANSIT]: 'Shipment is in transit between logistics processing hubs.',
  [SHIPMENT_STATUS.DESTINATION_HUB]: 'Shipment received and sorted at destination delivery hub.',
  [SHIPMENT_STATUS.OUT_FOR_DELIVERY]: 'Shipment is out for final delivery with courier.',
};

/**
 * Validates whether a state transition is permitted.
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateStatusTransition(fromStatus, toStatus) {
  if (!fromStatus || !toStatus) {
    return {
      valid: false,
      error: 'Both current status and next status are required for transition validation.',
    };
  }

  if (fromStatus === toStatus) {
    return {
      valid: false,
      error: `Shipment is already in status '${fromStatus}'.`,
    };
  }

  if (fromStatus === SHIPMENT_STATUS.DELIVERED) {
    return {
      valid: false,
      error: 'Cannot update status: Shipment is already DELIVERED (terminal state).',
    };
  }

  if (toStatus === SHIPMENT_STATUS.DELIVERED) {
    return {
      valid: false,
      error: 'Direct mutation to DELIVERED is prohibited. Delivery completion strictly requires customer OTP verification at /api/shipments/[id]/verify-otp.',
    };
  }

  const allowedNext = ALLOWED_STATUS_ADVANCEMENTS[fromStatus] || [];
  if (!allowedNext.includes(toStatus)) {
    return {
      valid: false,
      error: `Invalid status transition: Cannot transition from '${fromStatus}' to '${toStatus}'. Sequential step required.`,
    };
  }

  return { valid: true };
}

/**
 * Advances a shipment's delivery lifecycle status sequentially.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.shipmentId
 * @param {string} params.nextStatus
 * @param {Object} params.actorUser
 * @param {string} [params.location]
 * @param {boolean} [params.simulateFailure]
 * @returns {Promise<{ shipment: Object, message: string }>}
 */
export async function advanceShipmentStatus({
  shipmentId,
  nextStatus,
  actorUser,
  location,
  simulateFailure = false,
}) {
  const isObjectId = mongoose.isValidObjectId(shipmentId);
  const query = isObjectId
    ? { $or: [{ _id: shipmentId }, { trackingNumber: shipmentId.toString().toUpperCase().trim() }] }
    : { trackingNumber: shipmentId.toString().toUpperCase().trim() };

  const shipment = await Shipment.findOne(query);
  if (!shipment) {
    const err = new Error('Shipment not found.');
    err.statusCode = 404;
    throw err;
  }

  // Validate state machine rule
  const validation = validateStatusTransition(shipment.status, nextStatus);
  if (!validation.valid) {
    const err = new Error(validation.error);
    err.statusCode = 400;
    throw err;
  }

  // Requirement 6: Active courier states require an assigned agent
  const AGENT_REQUIRED_STATUSES = [
    SHIPMENT_STATUS.PICKED_UP,
    SHIPMENT_STATUS.IN_TRANSIT,
    SHIPMENT_STATUS.DESTINATION_HUB,
    SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    SHIPMENT_STATUS.DELIVERED,
  ];

  if (AGENT_REQUIRED_STATUSES.includes(nextStatus) && !shipment.agentId) {
    const err = new Error(
      `Cannot transition to ${nextStatus}: Shipment must have an assigned courier/agent.`
    );
    err.statusCode = 400;
    throw err;
  }

  // If transitioning to OUT_FOR_DELIVERY, route through dedicated OTP dispatch logic
  if (nextStatus === SHIPMENT_STATUS.OUT_FOR_DELIVERY) {
    return await transitionToOutForDelivery({
      shipmentId: shipment._id,
      actorUser,
      simulateFailure,
    });
  }

  // For other intermediate statuses (PICKED_UP, IN_TRANSIT, DESTINATION_HUB):
  shipment.status = nextStatus;
  await shipment.save();

  // Create TrackingEvent
  const description =
    STATUS_DESCRIPTIONS[nextStatus] || `Shipment status updated to ${nextStatus.replace(/_/g, ' ')}.`;

  await TrackingEvent.create({
    shipmentId: shipment._id,
    status: nextStatus,
    description,
    location: location || shipment.destinationBranchId?.city || 'En Route',
    branchId:
      nextStatus === SHIPMENT_STATUS.DESTINATION_HUB
        ? shipment.destinationBranchId
        : shipment.originBranchId,
    agentId: shipment.agentId || undefined,
  });

  // Create Notification for Customer
  await Notification.create({
    recipientId: shipment.customerId,
    title: `Shipment ${nextStatus.replace(/_/g, ' ')}`,
    message: `Shipment #${shipment.trackingNumber} has updated to ${nextStatus.replace(/_/g, ' ')}.`,
    type: 'SHIPMENT_STATUS_UPDATE',
    read: false,
  });

  return {
    shipment,
    message: `Shipment #${shipment.trackingNumber} updated to ${nextStatus}.`,
  };
}
