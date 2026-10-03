import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Shipment from '@/lib/models/Shipment';
import Payment from '@/lib/models/Payment';
import Invoice from '@/lib/models/Invoice';
import Notification from '@/lib/models/Notification';
import TrackingEvent from '@/lib/models/TrackingEvent';
import '@/lib/models/Branch';
import { PAYMENT_STATUS } from '@/lib/constants/paymentStatus';
import { SHIPMENT_STATUS } from '@/lib/constants/shipmentStatus';
import { ROLES } from '@/lib/constants/roles';
import { autoAssignShipment } from './assignmentService';

/**
 * Supported simulated payment methods
 */
export const SUPPORTED_PAYMENT_METHODS = Object.freeze([
  'CARD',
  'UPI',
  'NET_BANKING',
]);

/**
 * Base Payment Processor Interface
 * Gateway Adapter Architecture:
 * Allows dropping in real payment gateway adapters (e.g., Razorpay, Stripe)
 * in future phases without rewriting shipment/payment business logic.
 */
export class PaymentProcessor {
  /**
   * Process payment
   * @param {Object} params
   * @param {number} params.amount
   * @param {string} params.currency
   * @param {string} params.method
   * @param {Object} [params.metadata]
   * @returns {Promise<{success: boolean, transactionId: string, gateway: string, timestamp: Date}>}
   */
  async processPayment({ amount, currency, method, metadata }) {
    throw new Error('processPayment must be implemented by payment processor adapter');
  }
}

/**
 * Simulated Payment Processor
 * Internal realistic simulation for demo / academic purposes.
 * Generates secure server-side transaction IDs (PAY-XXXXXXXX).
 * No external API call and no real money transferred.
 */
export class SimulatedPaymentProcessor extends PaymentProcessor {
  async processPayment({ amount, currency = 'INR', method = 'UPI', metadata = {} }) {
    // Generate unique server-side transaction reference ID: PAY-XXXXXXXX
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const transactionId = `PAY-${hex}`;

    return {
      success: true,
      transactionId,
      amount: Number(amount),
      currency,
      method: method.toUpperCase(),
      gateway: 'SIMULATED',
      timestamp: new Date(),
    };
  }
}

// Default singleton processor instance (swap with real gateway adapter in future)
export const defaultPaymentProcessor = new SimulatedPaymentProcessor();

/**
 * Generates a unique transaction reference ID
 * Format: PAY-XXXXXXXX
 */
export function generateTransactionId() {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PAY-${hex}`;
}

/**
 * Generates a unique invoice number
 * Format: INV-XXXXXXXX
 */
export function generateInvoiceNumber() {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `INV-${hex}`;
}

/**
 * Normalize and validate payment method
 */
export function normalizePaymentMethod(method) {
  if (!method || typeof method !== 'string') return null;
  const upper = method.trim().toUpperCase().replace(/[-\s]/g, '_');
  if (upper === 'NETBANKING' || upper === 'NET_BANKING') return 'NET_BANKING';
  if (upper === 'CREDIT_CARD' || upper === 'DEBIT_CARD' || upper === 'CARD') return 'CARD';
  if (upper === 'UPI') return 'UPI';
  return null;
}

/**
 * Process a payment for a shipment.
 *
 * Flow:
 * 1. Validate shipment & customer authorization
 * 2. Prevent duplicate payment (atomic check)
 * 3. Use server-authoritative shipment.shippingCost (never client amount)
 * 4. Process payment through adapter (SimulatedPaymentProcessor)
 * 5. Persist Payment (PAID / SUCCESS)
 * 6. Update Shipment status to PAYMENT_CONFIRMED
 * 7. Create TrackingEvent (PAYMENT_CONFIRMED)
 * 8. Create Invoice (INV-XXXXXXXX)
 * 9. Create Notification
 *
 * @param {Object} options
 * @param {string} options.shipmentId - MongoDB ObjectId or Tracking Number
 * @param {string} options.customerId - Authenticated user's _id
 * @param {string} options.userRole - Authenticated user's role
 * @param {string} options.method - 'CARD' | 'UPI' | 'NET_BANKING'
 * @param {PaymentProcessor} [options.processor] - Payment processor adapter
 */
export async function processShipmentPayment({
  shipmentId,
  customerId,
  userRole,
  method,
  processor = defaultPaymentProcessor,
}) {
  await connectDB();

  // 1. Validate Payment Method
  const normalizedMethod = normalizePaymentMethod(method);
  if (!normalizedMethod || !SUPPORTED_PAYMENT_METHODS.includes(normalizedMethod)) {
    return {
      success: false,
      statusCode: 400,
      error: `Invalid payment method. Supported methods: ${SUPPORTED_PAYMENT_METHODS.join(', ')}`,
    };
  }

  // 2. Resolve Shipment
  if (!shipmentId) {
    return {
      success: false,
      statusCode: 400,
      error: 'Shipment identifier is required.',
    };
  }

  const isObjectId = mongoose.isValidObjectId(shipmentId);
  const query = isObjectId
    ? { $or: [{ _id: shipmentId }, { trackingNumber: shipmentId.toUpperCase().trim() }] }
    : { trackingNumber: shipmentId.toUpperCase().trim() };

  const shipment = await Shipment.findOne(query)
    .populate('originBranchId', 'name code city state country address')
    .populate('destinationBranchId', 'name code city state country address');

  if (!shipment) {
    return {
      success: false,
      statusCode: 404,
      error: 'Shipment not found.',
    };
  }

  // 3. Ownership / Authorization Check
  const shipmentOwnerId = shipment.customerId?._id?.toString() || shipment.customerId?.toString();
  const isOwner = shipmentOwnerId === customerId.toString();
  const isAdmin = userRole === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      statusCode: 403,
      error: 'Unauthorized: You can only pay for your own shipments.',
    };
  }

  // 4. Duplicate Payment Check & Shipment State Validation
  // Check if shipment has already been confirmed/paid
  if (shipment.status !== SHIPMENT_STATUS.BOOKED) {
    // Check if it already has a successful payment
    const existingPayment = await Payment.findOne({
      shipmentId: shipment._id,
      status: { $in: ['PAID', 'SUCCESS'] },
    }).lean();

    return {
      success: false,
      statusCode: 409,
      error: 'This shipment has already been paid and confirmed.',
      alreadyPaid: true,
      existingPayment: existingPayment
        ? {
            transactionId: existingPayment.transactionId,
            amount: existingPayment.amount,
            status: existingPayment.status,
            paidAt: existingPayment.paidAt,
          }
        : null,
    };
  }

  // Also check Payment collection for existing successful payment on this shipment
  const existingPaid = await Payment.findOne({
    shipmentId: shipment._id,
    status: { $in: ['PAID', 'SUCCESS'] },
  }).lean();

  if (existingPaid) {
    return {
      success: false,
      statusCode: 409,
      error: 'A successful payment already exists for this shipment.',
      alreadyPaid: true,
      existingPayment: {
        transactionId: existingPaid.transactionId,
        amount: existingPaid.amount,
        status: existingPaid.status,
        paidAt: existingPaid.paidAt,
      },
    };
  }

  // 5. Server-Authoritative Amount
  const serverAmount = Number(shipment.shippingCost);
  if (!serverAmount || isNaN(serverAmount) || serverAmount <= 0) {
    return {
      success: false,
      statusCode: 400,
      error: 'Invalid shipment shipping cost calculation.',
    };
  }

  // 6. Process Payment through Processor Adapter
  const simulationResult = await processor.processPayment({
    amount: serverAmount,
    currency: 'INR',
    method: normalizedMethod,
    metadata: {
      shipmentId: shipment._id.toString(),
      trackingNumber: shipment.trackingNumber,
      customerId: shipmentOwnerId,
    },
  });

  if (!simulationResult || !simulationResult.success) {
    return {
      success: false,
      statusCode: 402,
      error: simulationResult?.error || 'Payment processing failed.',
    };
  }

  const transactionId = simulationResult.transactionId;

  // 7. Atomic Shipment Update & Persistence
  // We atomically update status from BOOKED to PAYMENT_CONFIRMED to prevent race conditions
  const updatedShipment = await Shipment.findOneAndUpdate(
    { _id: shipment._id, status: SHIPMENT_STATUS.BOOKED },
    { $set: { status: SHIPMENT_STATUS.PAYMENT_CONFIRMED } },
    { new: true }
  );

  if (!updatedShipment) {
    return {
      success: false,
      statusCode: 409,
      error: 'Shipment status has already changed or payment is already processed.',
    };
  }

  // 8. Create Payment Record
  let paymentRecord;
  try {
    paymentRecord = await Payment.create({
      shipmentId: shipment._id,
      customerId: shipment.customerId,
      amount: serverAmount,
      currency: 'INR',
      method: normalizedMethod,
      status: PAYMENT_STATUS.PAID,
      transactionId,
      paidAt: simulationResult.timestamp || new Date(),
    });
  } catch (error) {
    // If creation fails due to duplicate transaction ID, retry with new ID once
    if (error.code === 11000) {
      paymentRecord = await Payment.create({
        shipmentId: shipment._id,
        customerId: shipment.customerId,
        amount: serverAmount,
        currency: 'INR',
        method: normalizedMethod,
        status: PAYMENT_STATUS.PAID,
        transactionId: generateTransactionId(),
        paidAt: new Date(),
      });
    } else {
      throw error;
    }
  }

  // 9. Create Tracking Event: PAYMENT_CONFIRMED
  const originBranch = shipment.originBranchId;
  const locationString = originBranch
    ? `${originBranch.city || originBranch.name}, ${originBranch.state || 'IN'}`
    : shipment.senderAddress || 'Origin Hub';

  const trackingEvent = await TrackingEvent.create({
    shipmentId: shipment._id,
    status: SHIPMENT_STATUS.PAYMENT_CONFIRMED,
    description: 'Payment confirmed successfully',
    location: locationString,
    branchId: shipment.originBranchId?._id || shipment.originBranchId || null,
    createdAt: new Date(),
  });

  // 10. Create or Reuse Invoice
  let invoice = await Invoice.findOne({ shipmentId: shipment._id });
  if (!invoice) {
    // Generate unique invoice number with retry if collision
    let invoiceNumber = generateInvoiceNumber();
    let collision = await Invoice.findOne({ invoiceNumber });
    while (collision) {
      invoiceNumber = generateInvoiceNumber();
      collision = await Invoice.findOne({ invoiceNumber });
    }

    invoice = await Invoice.create({
      invoiceNumber,
      shipmentId: shipment._id,
      customerId: shipment.customerId,
      subtotal: serverAmount,
      tax: 0,
      total: serverAmount,
      currency: 'INR',
      issuedAt: new Date(),
    });
  }

  // 11. Create Notification for Customer
  const notification = await Notification.create({
    recipientId: shipment.customerId,
    type: 'PAYMENT',
    title: 'Payment Successful',
    message: `Payment for shipment ${shipment.trackingNumber} has been confirmed.`,
    read: false,
    relatedShipmentId: shipment._id,
    createdAt: new Date(),
  });

  // 12. Trigger Automatic Agent Assignment
  let assignment = null;
  try {
    assignment = await autoAssignShipment(updatedShipment._id);
  } catch (assignError) {
    console.error('[Payment -> Auto-Assignment Notice]:', assignError.message);
  }

  const finalShipmentStatus =
    assignment?.assigned && assignment?.shipment?.status
      ? assignment.shipment.status
      : updatedShipment.status;

  const finalAgentId =
    assignment?.assigned && assignment?.shipment?.agentId
      ? assignment.shipment.agentId
      : null;

  return {
    success: true,
    statusCode: 201,
    payment: {
      _id: paymentRecord._id.toString(),
      transactionId: paymentRecord.transactionId,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      method: paymentRecord.method,
      status: paymentRecord.status,
      paidAt: paymentRecord.paidAt,
    },
    invoice: {
      _id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      currency: invoice.currency,
      issuedAt: invoice.issuedAt,
    },
    shipment: {
      _id: updatedShipment._id.toString(),
      trackingNumber: updatedShipment.trackingNumber,
      status: finalShipmentStatus,
      agentId: finalAgentId,
    },
    trackingEvent: {
      _id: trackingEvent._id.toString(),
      status: trackingEvent.status,
      description: trackingEvent.description,
      createdAt: trackingEvent.createdAt,
    },
    notification: {
      _id: notification._id.toString(),
      title: notification.title,
    },
    assignment: assignment?.assigned
      ? {
          assigned: true,
          agent: assignment.agent,
          trackingEvent: assignment.trackingEvent,
        }
      : {
          assigned: false,
          reason: assignment?.reason || 'No available delivery agent found for destination branch',
        },
  };

}

/**
 * Retrieve payment for a given shipment
 */
export async function getPaymentByShipment(shipmentIdentifier, userId, userRole) {
  await connectDB();

  if (!shipmentIdentifier) return null;

  const isObjectId = mongoose.isValidObjectId(shipmentIdentifier);
  const query = isObjectId
    ? { $or: [{ _id: shipmentIdentifier }, { trackingNumber: shipmentIdentifier.toUpperCase().trim() }] }
    : { trackingNumber: shipmentIdentifier.toUpperCase().trim() };

  const shipment = await Shipment.findOne(query).lean();
  if (!shipment) return null;

  // Authorization check
  const isOwner = shipment.customerId.toString() === userId.toString();
  const isAdmin = userRole === ROLES.ADMIN;
  if (!isOwner && !isAdmin) return null;

  const payment = await Payment.findOne({
    shipmentId: shipment._id,
    status: { $in: ['PAID', 'SUCCESS'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const invoice = await Invoice.findOne({ shipmentId: shipment._id }).lean();

  return {
    shipment: {
      _id: shipment._id.toString(),
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      shippingCost: shipment.shippingCost,
      serviceType: shipment.serviceType,
    },
    payment: payment
      ? {
          _id: payment._id.toString(),
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          paidAt: payment.paidAt,
        }
      : null,
    invoice: invoice
      ? {
          _id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          currency: invoice.currency,
          issuedAt: invoice.issuedAt,
        }
      : null,
  };
}

/**
 * Retrieve payment by payment ID
 */
export async function getPaymentById(paymentId, userId, userRole) {
  await connectDB();

  if (!mongoose.isValidObjectId(paymentId)) return null;

  const payment = await Payment.findById(paymentId)
    .populate('shipmentId', 'trackingNumber status shippingCost customerId')
    .lean();

  if (!payment) return null;

  const isOwner = payment.customerId.toString() === userId.toString();
  const isAdmin = userRole === ROLES.ADMIN;
  if (!isOwner && !isAdmin) return null;

  return payment;
}
