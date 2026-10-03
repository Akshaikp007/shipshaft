import mongoose from 'mongoose';
import { SHIPMENT_STATUS, ALL_SHIPMENT_STATUSES } from '../constants/shipmentStatus.js';

const ShipmentSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      required: [true, 'Tracking number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      index: true,
    },
    originBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Origin branch ID is required'],
    },
    destinationBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Destination branch ID is required'],
    },

    // Sender Information
    senderName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
    },
    senderPhone: {
      type: String,
      required: [true, 'Sender phone number is required'],
      trim: true,
    },
    senderAddress: {
      type: String,
      required: [true, 'Sender address is required'],
      trim: true,
    },

    // Receiver Information
    receiverName: {
      type: String,
      required: [true, 'Receiver name is required'],
      trim: true,
    },
    receiverPhone: {
      type: String,
      required: [true, 'Receiver phone number is required'],
      trim: true,
    },
    receiverAddress: {
      type: String,
      required: [true, 'Receiver address is required'],
      trim: true,
    },

    // Package Details
    packageDescription: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      required: [true, 'Package weight is required'],
      min: [0.01, 'Weight must be greater than zero'],
    },
    length: {
      type: Number,
      min: 0,
    },
    width: {
      type: Number,
      min: 0,
    },
    height: {
      type: Number,
      min: 0,
    },

    // Service Specification
    serviceType: {
      type: String,
      default: 'Standard Express',
      trim: true,
    },

    // Financial
    shippingCost: {
      type: Number,
      required: [true, 'Shipping cost is required'],
      min: [0, 'Shipping cost cannot be negative'],
    },

    // Status Lifecycle
    status: {
      type: String,
      enum: {
        values: ALL_SHIPMENT_STATUSES,
        message: 'Invalid shipment status: {VALUE}',
      },
      default: SHIPMENT_STATUS.BOOKED,
      required: true,
      index: true,
    },

    // Delivery Windows
    expectedDeliveryDate: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },

    // OTP Handover Security (Do not store raw OTP)
    otpHash: {
      type: String,
      select: false, // Never exposed in normal queries
    },
    otpExpiresAt: {
      type: Date,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpVerifiedAt: {
      type: Date,
    },
    otpLastSentAt: {
      type: Date,
    },

    // QR Verification
    qrToken: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined without colliding on uniqueness
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models?.Shipment) {
  delete mongoose.models.Shipment;
}

const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);

export default Shipment;
