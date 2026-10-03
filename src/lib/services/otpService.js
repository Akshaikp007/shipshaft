import crypto from 'crypto';
import mongoose from 'mongoose';
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';
import Agent from '../models/Agent.js';
import TrackingEvent from '../models/TrackingEvent.js';
import Notification from '../models/Notification.js';
import { sendDeliveryOtpEmail } from './emailService.js';
import { SHIPMENT_STATUS } from '../constants/shipmentStatus.js';

const OTP_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFICATION_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

/**
 * Generate cryptographically secure 6-digit OTP code (100000 - 999999).
 * Never uses Math.random().
 * @returns {string}
 */
export function generateDeliveryOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash a 6-digit OTP using SHA-256 with a system secret salt.
 * @param {string} otp
 * @returns {string}
 */
export function hashOtp(otp) {
  const secret = process.env.JWT_SECRET || 'shipshaft-delivery-otp-salt-key';
  return crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex');
}

/**
 * Timing-safe comparison of provided OTP with stored hash.
 * @param {string} rawOtp
 * @param {string} storedHash
 * @returns {boolean}
 */
export function verifyOtpMatch(rawOtp, storedHash) {
  if (!rawOtp || !storedHash || typeof rawOtp !== 'string' || typeof storedHash !== 'string') {
    return false;
  }
  const candidateHash = hashOtp(rawOtp);
  try {
    const a = Buffer.from(candidateHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Transition a shipment from DESTINATION_HUB to OUT_FOR_DELIVERY.
 * Generates OTP, sends real/simulated email, and only updates DB if email succeeds.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.shipmentId
 * @param {Object} params.actorUser - Authenticated user initiating transition (Agent or Admin)
 * @returns {Promise<{ shipment: Object, message: string }>}
 */
export async function transitionToOutForDelivery({ shipmentId, actorUser, simulateFailure = false }) {
  console.log('[OTP DEBUG] OUT_FOR_DELIVERY transition started');

  const isObjectId = mongoose.isValidObjectId(shipmentId);
  const query = isObjectId
    ? { $or: [{ _id: shipmentId }, { trackingNumber: shipmentId.toString().toUpperCase().trim() }] }
    : { trackingNumber: shipmentId.toString().toUpperCase().trim() };

  const shipment = await Shipment.findOne(query);
  if (!shipment) {
    throw new Error('Shipment record not found.');
  }

  // Strict state machine validation: must be at DESTINATION_HUB
  if (shipment.status !== SHIPMENT_STATUS.DESTINATION_HUB) {
    throw new Error(
      `Cannot transition to OUT_FOR_DELIVERY: Current status is '${shipment.status}', but must be 'DESTINATION_HUB'.`
    );
  }

  // Retrieve customer to get registered email
  console.log('[OTP DEBUG] Customer lookup started');
  const customer = await User.findById(shipment.customerId);
  if (!customer || !customer.email) {
    throw new Error('Customer account or registered email not found for this shipment.');
  }
  console.log(`[OTP DEBUG] Customer email resolved: ${customer.email}`);

  // 1. Generate cryptographically secure OTP
  console.log('[OTP DEBUG] OTP generation started');
  const rawOtp = generateDeliveryOtp();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_VALIDITY_MS);
  const now = new Date();

  // 2. Attempt email delivery BEFORE updating status or saving hash
  // If email delivery fails, an exception is thrown and the shipment stays at DESTINATION_HUB
  console.log('[OTP DEBUG] Email send started');
  try {
    await sendDeliveryOtpEmail({
      to: customer.email,
      trackingNumber: shipment.trackingNumber,
      otp: rawOtp,
      expiresInMinutes: 10,
      simulateFailure,
    });
    console.log('[OTP DEBUG] Email send completed');
  } catch (error) {
    console.error(`[OTP DEBUG] Email send failed: ${error.message}`);
    throw error;
  }

  // 3. Email succeeded: persist OTP hash, expiry, attempts, and update status
  shipment.status = SHIPMENT_STATUS.OUT_FOR_DELIVERY;
  shipment.otpHash = hashedOtp;
  shipment.otpExpiresAt = expiresAt;
  shipment.otpAttempts = 0;
  shipment.otpLastSentAt = now;
  await shipment.save();
  await Shipment.updateOne(
    { _id: shipment._id },
    { $set: { otpLastSentAt: now } }
  );

  // 4. Create OUT_FOR_DELIVERY TrackingEvent (Never log or include OTP)
  await TrackingEvent.create({
    shipmentId: shipment._id,
    status: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    description: `Package is out for delivery. Secure verification OTP sent to customer's registered email.`,
    location: shipment.receiverAddress || 'Destination Area',
    branchId: shipment.destinationBranchId,
  });

  // 5. Create Customer Notification (Never include OTP)
  await Notification.create({
    recipientId: shipment.customerId,
    title: 'Shipment Out for Delivery',
    message: `Shipment #${shipment.trackingNumber} is out for delivery. Check your registered email for your delivery verification OTP.`,
    type: 'DELIVERY_UPDATE',
    read: false,
  });

  return {
    shipment,
    message: `Shipment #${shipment.trackingNumber} is now out for delivery. Verification code dispatched to registered email.`,
  };
}

/**
 * Verifies delivery OTP provided by the recipient to the assigned delivery agent.
 * Only the assigned agent can complete this step.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.shipmentId
 * @param {string} params.otp - 6-digit candidate OTP entered by agent
 * @param {Object} params.agentUser - Authenticated user (Role: AGENT)
 * @returns {Promise<{ success: boolean, shipment?: Object, error?: string, attemptsRemaining?: number }>}
 */
export async function verifyDeliveryOtp({ shipmentId, otp, agentUser }) {
  if (!agentUser || agentUser.role !== 'AGENT') {
    return {
      success: false,
      statusCode: 403,
      error: 'Forbidden: Only authorized delivery agents can verify delivery OTP.',
    };
  }

  // Look up agent record
  const agentProfile = await Agent.findOne({ userId: agentUser._id });
  if (!agentProfile) {
    return {
      success: false,
      statusCode: 404,
      error: 'Agent profile not found.',
    };
  }

  const isObjectId = mongoose.isValidObjectId(shipmentId);
  const query = isObjectId
    ? { $or: [{ _id: shipmentId }, { trackingNumber: shipmentId.toString().toUpperCase().trim() }] }
    : { trackingNumber: shipmentId.toString().toUpperCase().trim() };

  // Explicitly include otpHash which has select: false
  const shipment = await Shipment.findOne(query).select('+otpHash');
  if (!shipment) {
    return {
      success: false,
      statusCode: 404,
      error: 'Shipment not found.',
    };
  }

  // Verify shipment is assigned to this agent
  const assignedAgentId = shipment.agentId?.toString();
  if (!assignedAgentId || assignedAgentId !== agentProfile._id.toString()) {
    return {
      success: false,
      statusCode: 403,
      error: 'Forbidden: This shipment is not assigned to you.',
    };
  }

  // Verify status is OUT_FOR_DELIVERY
  if (shipment.status !== SHIPMENT_STATUS.OUT_FOR_DELIVERY) {
    return {
      success: false,
      statusCode: 400,
      error: `Shipment is not currently out for delivery (Current status: ${shipment.status}).`,
    };
  }

  // Check if OTP hash exists
  if (!shipment.otpHash) {
    return {
      success: false,
      statusCode: 400,
      error: 'No active verification OTP found for this shipment. Please ask the customer to request a new code.',
    };
  }

  // Check attempt limit
  if (shipment.otpAttempts >= MAX_VERIFICATION_ATTEMPTS) {
    return {
      success: false,
      statusCode: 400,
      error: 'Maximum verification attempts (5) exceeded. A new OTP must be sent to the customer.',
      attemptsRemaining: 0,
    };
  }

  // Check expiry
  if (!shipment.otpExpiresAt || new Date() > new Date(shipment.otpExpiresAt)) {
    return {
      success: false,
      statusCode: 400,
      error: 'The delivery verification OTP has expired. Please ask the customer to request a new code.',
    };
  }

  // Validate OTP format
  if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
    shipment.otpAttempts = (shipment.otpAttempts || 0) + 1;
    await shipment.save();
    const remaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - shipment.otpAttempts);
    return {
      success: false,
      statusCode: 400,
      error: 'OTP must be exactly 6 digits.',
      attemptsRemaining: remaining,
    };
  }

  // Compare OTP with stored hash
  const isValid = verifyOtpMatch(otp.trim(), shipment.otpHash);
  if (!isValid) {
    shipment.otpAttempts = (shipment.otpAttempts || 0) + 1;
    await shipment.save();
    const remaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - shipment.otpAttempts);
    return {
      success: false,
      statusCode: 400,
      error: remaining > 0 ? 'Invalid OTP. Please check and try again.' : 'Maximum verification attempts (5) exceeded.',
      attemptsRemaining: remaining,
    };
  }

  // SUCCESS: Update status to DELIVERED, record timestamp, clear OTP hash to prevent reuse
  const now = new Date();
  shipment.status = SHIPMENT_STATUS.DELIVERED;
  shipment.deliveredAt = now;
  shipment.otpVerifiedAt = now;
  shipment.otpHash = undefined;
  shipment.otpExpiresAt = undefined;
  await shipment.save();

  // Create DELIVERED TrackingEvent
  await TrackingEvent.create({
    shipmentId: shipment._id,
    status: SHIPMENT_STATUS.DELIVERED,
    description: `Package delivered successfully. Recipient handover verified via secure one-time passcode.`,
    location: shipment.receiverAddress || 'Delivered to Recipient',
    branchId: shipment.destinationBranchId,
  });

  // Create Customer Notification
  await Notification.create({
    recipientId: shipment.customerId,
    title: 'Shipment Delivered',
    message: `Shipment #${shipment.trackingNumber} has been delivered successfully. Thank you for choosing ShipShaft!`,
    type: 'SHIPMENT_DELIVERED',
    read: false,
  });

  return {
    success: true,
    statusCode: 200,
    message: `Shipment #${shipment.trackingNumber} successfully verified and marked DELIVERED.`,
    shipment: {
      id: shipment._id.toString(),
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      deliveredAt: shipment.deliveredAt,
      otpVerifiedAt: shipment.otpVerifiedAt,
    },
  };
}

/**
 * Resend OTP to customer's registered email.
 * Enforces 60-second cooldown and ownership.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.shipmentId
 * @param {Object} params.customerUser - Authenticated Customer
 * @returns {Promise<{ success: boolean, message?: string, error?: string, retryAfter?: number }>}
 */
export async function resendDeliveryOtp({ shipmentId, customerUser }) {
  if (!customerUser) {
    return {
      success: false,
      statusCode: 401,
      error: 'Authentication required to resend OTP.',
    };
  }

  const isObjectId = mongoose.isValidObjectId(shipmentId);
  const query = isObjectId
    ? { $or: [{ _id: shipmentId }, { trackingNumber: shipmentId.toString().toUpperCase().trim() }] }
    : { trackingNumber: shipmentId.toString().toUpperCase().trim() };

  const shipment = await Shipment.findOne(query);
  if (!shipment) {
    return {
      success: false,
      statusCode: 404,
      error: 'Shipment not found.',
    };
  }

  // Authorization: Only the customer who owns this shipment can request a resend
  const ownerId = shipment.customerId?.toString();
  if (ownerId !== customerUser._id.toString()) {
    return {
      success: false,
      statusCode: 403,
      error: 'Forbidden: You can only request OTP resend for your own shipments.',
    };
  }

  // Status must be OUT_FOR_DELIVERY
  if (shipment.status !== SHIPMENT_STATUS.OUT_FOR_DELIVERY) {
    return {
      success: false,
      statusCode: 400,
      error: 'OTP resend is only available when the shipment is out for delivery.',
    };
  }

  // Enforce 60-second cooldown
  if (shipment.otpLastSentAt) {
    const elapsed = Date.now() - new Date(shipment.otpLastSentAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        success: false,
        statusCode: 429,
        error: `Please wait ${retryAfter} seconds before requesting a new OTP.`,
        retryAfter,
      };
    }
  }

  // Generate new OTP, invalidating the old one
  const rawOtp = generateDeliveryOtp();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_VALIDITY_MS);
  const now = new Date();

  // Send email to customer's registered email
  await sendDeliveryOtpEmail({
    to: customerUser.email,
    trackingNumber: shipment.trackingNumber,
    otp: rawOtp,
    expiresInMinutes: 10,
  });

  // Update DB
  shipment.otpHash = hashedOtp;
  shipment.otpExpiresAt = expiresAt;
  shipment.otpAttempts = 0;
  shipment.otpLastSentAt = now;
  await shipment.save();
  await Shipment.updateOne(
    { _id: shipment._id },
    { $set: { otpLastSentAt: now } }
  );

  return {
    success: true,
    statusCode: 200,
    message: 'A new delivery verification OTP has been sent to your registered email address.',
  };
}
