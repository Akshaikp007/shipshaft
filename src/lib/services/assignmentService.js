import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Agent from '@/lib/models/Agent';
import User from '@/lib/models/User';
import Branch from '@/lib/models/Branch';
import TrackingEvent from '@/lib/models/TrackingEvent';
import Notification from '@/lib/models/Notification';
import { SHIPMENT_STATUS } from '@/lib/constants/shipmentStatus';
import { ROLES } from '@/lib/constants/roles';

/**
 * Active statuses that count toward an agent's current delivery workload.
 * Terminal states (DELIVERED) are excluded.
 */
export const ACTIVE_DELIVERY_STATUSES = Object.freeze([
  SHIPMENT_STATUS.ASSIGNED,
  SHIPMENT_STATUS.PICKED_UP,
  SHIPMENT_STATUS.ORIGIN_HUB,
  SHIPMENT_STATUS.IN_TRANSIT,
  SHIPMENT_STATUS.DESTINATION_HUB,
  SHIPMENT_STATUS.OUT_FOR_DELIVERY,
]);

/**
 * Calculate the active workload (in-progress shipment count) for a specific agent.
 * Server-side calculation directly from the Shipment collection.
 *
 * @param {string|mongoose.Types.ObjectId} agentId
 * @returns {Promise<number>}
 */
export async function getAgentWorkload(agentId) {
  if (!agentId) return 0;
  await connectDB();
  return await Shipment.countDocuments({
    agentId,
    status: { $in: ACTIVE_DELIVERY_STATUSES },
  });
}

/**
 * Retrieve eligible delivery agents for a given destination branch.
 *
 * Eligibility Criteria:
 * 1. Agent belongs to the destination branch (destinationBranchId)
 * 2. Agent is active (status !== 'OFFLINE' && isAvailable === true && availability !== 'OFFLINE')
 * 3. Associated User exists and user.isActive === true
 *
 * @param {string|mongoose.Types.ObjectId} destinationBranchId
 * @returns {Promise<Array>} List of eligible Agent documents populated with User and Branch
 */
export async function getEligibleAgentsForBranch(destinationBranchId) {
  await connectDB();

  if (!destinationBranchId) return [];

  const agents = await Agent.find({
    branchId: destinationBranchId,
    isAvailable: true,
    status: { $nin: ['OFFLINE', 'INACTIVE'] },
    availability: { $nin: ['OFFLINE', 'BUSY'] },
  })
    .populate('userId', 'name email phone avatar isActive role')
    .populate('branchId', 'name code city state address')
    .lean();

  // Filter out agents whose user account is inactive or missing
  return agents.filter((a) => a.userId && a.userId.isActive);
}

/**
 * Deterministically select the best agent from a list of eligible agents.
 *
 * Rule Hierarchy:
 * 1. Lowest current active workload (fewest active deliveries)
 * 2. Deterministic tie-breaker: Lowest employeeId ascending (e.g. 'AGT-001' < 'AGT-002')
 * 3. Deterministic fallback: MongoDB ObjectId string comparison
 *
 * Absolutely NO AI, NO random selection.
 *
 * @param {Array} eligibleAgents - List of eligible agent objects
 * @returns {Promise<{agent: Object|null, workload: number}>}
 */
export async function selectDeterministicAgent(eligibleAgents) {
  if (!eligibleAgents || eligibleAgents.length === 0) {
    return { agent: null, workload: 0 };
  }

  // Calculate real-time active workload for each eligible candidate
  const candidatesWithWorkload = await Promise.all(
    eligibleAgents.map(async (agent) => {
      const workload = await getAgentWorkload(agent._id);
      return {
        agent,
        workload,
        employeeId: (agent.employeeId || '').toUpperCase().trim(),
        idStr: agent._id.toString(),
      };
    })
  );

  // Sort deterministically
  candidatesWithWorkload.sort((a, b) => {
    // 1. Lowest workload first
    if (a.workload !== b.workload) {
      return a.workload - b.workload;
    }
    // 2. Tie-break: employeeId ascending (alphabetical/lexicographical)
    if (a.employeeId !== b.employeeId) {
      return a.employeeId.localeCompare(b.employeeId);
    }
    // 3. Fallback: string _id
    return a.idStr.localeCompare(b.idStr);
  });

  const selected = candidatesWithWorkload[0];
  return {
    agent: selected.agent,
    workload: selected.workload,
  };
}

/**
 * Automatically assign an eligible delivery agent to a shipment.
 * Triggered after payment confirmation (PAYMENT_CONFIRMED).
 *
 * If no eligible agent is available at the destination branch:
 * Shipment remains PAYMENT_CONFIRMED safely without error.
 *
 * @param {string|mongoose.Types.ObjectId} shipmentId
 * @returns {Promise<{success: boolean, assigned: boolean, shipment?: Object, agent?: Object, reason?: string}>}
 */
export async function autoAssignShipment(shipmentId) {
  await connectDB();

  const isObjectId = mongoose.isValidObjectId(shipmentId);
  const query = isObjectId
    ? { $or: [{ _id: shipmentId }, { trackingNumber: shipmentId.toString().toUpperCase().trim() }] }
    : { trackingNumber: shipmentId.toString().toUpperCase().trim() };

  const shipment = await Shipment.findOne(query)
    .populate('originBranchId', 'name code city state')
    .populate('destinationBranchId', 'name code city state');

  if (!shipment) {
    return {
      success: false,
      assigned: false,
      reason: 'Shipment not found.',
    };
  }

  // Only assign shipments that are in PAYMENT_CONFIRMED status
  if (shipment.status !== SHIPMENT_STATUS.PAYMENT_CONFIRMED) {
    return {
      success: false,
      assigned: false,
      reason: `Shipment is not eligible for auto-assignment. Current status: ${shipment.status}`,
    };
  }

  // Find eligible agents at destination branch
  const eligibleAgents = await getEligibleAgentsForBranch(shipment.destinationBranchId?._id || shipment.destinationBranchId);

  if (eligibleAgents.length === 0) {
    return {
      success: true,
      assigned: false,
      reason: 'No available delivery agent found for the destination branch.',
      shipment: {
        _id: shipment._id.toString(),
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
      },
    };
  }

  // Deterministically select lowest workload agent
  const { agent: selectedAgent } = await selectDeterministicAgent(eligibleAgents);

  if (!selectedAgent) {
    return {
      success: true,
      assigned: false,
      reason: 'No eligible agent could be selected.',
    };
  }

  // Perform assignment
  return await assignShipmentToAgent({
    shipment,
    agentId: selectedAgent._id,
    isAutomatic: true,
  });
}

/**
 * Assign or reassign a delivery agent to a shipment.
 * Used by automatic assignment and Admin manual assignment / reassignment.
 *
 * @param {Object} options
 * @param {Object|string} options.shipment - Shipment doc or ID
 * @param {string|mongoose.Types.ObjectId} options.agentId - Agent _id
 * @param {boolean} [options.isAutomatic=false] - True if automatic, false if Admin manual
 * @param {string} [options.adminUserId] - Admin user ID if manual override
 * @returns {Promise<Object>}
 */
export async function assignShipmentToAgent({
  shipment: shipmentInput,
  agentId,
  isAutomatic = false,
  adminUserId = null,
}) {
  await connectDB();

  // 1. Resolve shipment
  let shipment = shipmentInput;
  if (!shipment || typeof shipment === 'string' || !shipment.trackingNumber) {
    const shipmentIdentifier = shipmentInput;
    const isObjectId = mongoose.isValidObjectId(shipmentIdentifier);
    const query = isObjectId
      ? { $or: [{ _id: shipmentIdentifier }, { trackingNumber: shipmentIdentifier.toString().toUpperCase().trim() }] }
      : { trackingNumber: shipmentIdentifier.toString().toUpperCase().trim() };

    shipment = await Shipment.findOne(query)
      .populate('destinationBranchId', 'name code city state')
      .populate('originBranchId', 'name code city state');
  }

  if (!shipment) {
    return { success: false, statusCode: 404, error: 'Shipment not found.' };
  }

  // Prevent assignment of delivered or cancelled shipments
  if (shipment.status === SHIPMENT_STATUS.DELIVERED) {
    return {
      success: false,
      statusCode: 400,
      error: 'Cannot assign an agent to an already delivered shipment.',
    };
  }

  // Prevent assignment of unpaid shipments (state machine strictly requires PAYMENT_CONFIRMED first)
  if (shipment.status === SHIPMENT_STATUS.BOOKED) {
    return {
      success: false,
      statusCode: 400,
      error: 'Cannot assign an agent to an unpaid shipment. Payment must be confirmed first.',
    };
  }

  // 2. Resolve Agent
  if (!mongoose.isValidObjectId(agentId)) {
    return { success: false, statusCode: 400, error: 'Invalid agent ID format.' };
  }

  const agent = await Agent.findById(agentId)
    .populate('userId', 'name email phone isActive')
    .populate('branchId', 'name code city state');

  if (!agent) {
    return { success: false, statusCode: 404, error: 'Agent record not found.' };
  }

  if (!agent.userId || !agent.userId.isActive) {
    return {
      success: false,
      statusCode: 400,
      error: 'The selected agent account is inactive.',
    };
  }

  if (agent.status === 'OFFLINE' || agent.status === 'INACTIVE' || agent.availability === 'OFFLINE') {
    return {
      success: false,
      statusCode: 400,
      error: 'The selected agent is currently inactive or offline.',
    };
  }

  // 3. Verify Agent belongs to destination branch
  const shipmentDestBranchId =
    shipment.destinationBranchId?._id?.toString() || shipment.destinationBranchId?.toString();
  const agentBranchId = agent.branchId?._id?.toString() || agent.branchId?.toString();

  if (shipmentDestBranchId !== agentBranchId) {
    return {
      success: false,
      statusCode: 400,
      error: `Agent belongs to branch ${agent.branchId?.code || 'OTHER'}, but shipment destination branch is ${shipment.destinationBranchId?.code || 'DEST'}. Agents must belong to the destination branch.`,
    };
  }

  // 4. Check Reassignment vs Initial Assignment
  const previousAgentId = shipment.agentId ? shipment.agentId.toString() : null;
  const isReassignment = Boolean(previousAgentId && previousAgentId !== agent._id.toString());

  // 5. Update Shipment
  shipment.agentId = agent._id;
  // If shipment was PAYMENT_CONFIRMED, transition to ASSIGNED
  if (shipment.status === SHIPMENT_STATUS.PAYMENT_CONFIRMED) {
    shipment.status = SHIPMENT_STATUS.ASSIGNED;
  }
  await shipment.save();

  // 6. Create TrackingEvent
  const destBranch = shipment.destinationBranchId;
  const locationString = destBranch
    ? `${destBranch.city || destBranch.name}, ${destBranch.state || 'IN'}`
    : 'Destination Logistics Hub';

  let eventDescription = 'Shipment assigned to delivery agent';
  if (isReassignment) {
    eventDescription = `Shipment reassigned to delivery agent (${agent.employeeId} - ${agent.userId?.name})`;
  } else if (!isAutomatic) {
    eventDescription = `Shipment manually assigned to delivery agent (${agent.employeeId} - ${agent.userId?.name})`;
  }

  const trackingEvent = await TrackingEvent.create({
    shipmentId: shipment._id,
    status: SHIPMENT_STATUS.ASSIGNED,
    description: eventDescription,
    location: locationString,
    branchId: agent.branchId?._id || agent.branchId,
    agentId: agent._id,
    createdAt: new Date(),
  });

  // 7. Create Notification for Customer
  const notifTitle = isReassignment ? 'Shipment Reassigned' : 'Shipment Assigned';
  const notifMessage = isReassignment
    ? `Shipment ${shipment.trackingNumber} has been reassigned to delivery agent ${agent.employeeId}.`
    : `Shipment ${shipment.trackingNumber} has been assigned to a delivery agent.`;

  await Notification.create({
    recipientId: shipment.customerId,
    type: 'SHIPMENT',
    title: notifTitle,
    message: notifMessage,
    relatedShipmentId: shipment._id,
    read: false,
    createdAt: new Date(),
  });

  return {
    success: true,
    statusCode: 200,
    assigned: true,
    isReassignment,
    shipment: {
      _id: shipment._id.toString(),
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      agentId: agent._id.toString(),
    },
    agent: {
      _id: agent._id.toString(),
      employeeId: agent.employeeId,
      name: agent.userId?.name,
      branchCode: agent.branchId?.code,
    },
    trackingEvent: {
      _id: trackingEvent._id.toString(),
      status: trackingEvent.status,
      description: trackingEvent.description,
      createdAt: trackingEvent.createdAt,
    },
  };
}

/**
 * Retrieve delivery agent details for a specific authenticated User
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Object|null>}
 */
export async function getAgentByUserId(userId) {
  await connectDB();
  return await Agent.findOne({ userId })
    .populate('userId', 'name email phone avatar isActive role')
    .populate('branchId', 'name code city state address phone')
    .lean();
}
