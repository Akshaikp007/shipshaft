import mongoose from 'mongoose';
import { PAYMENT_STATUS, ALL_PAYMENT_STATUSES } from '@/lib/constants/paymentStatus';

const PaymentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Shipment ID is required'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    method: {
      type: String,
      trim: true,
      default: 'UPI',
    },
    status: {
      type: String,
      enum: {
        values: ALL_PAYMENT_STATUSES,
        message: 'Invalid payment status: {VALUE}',
      },
      default: PAYMENT_STATUS.PENDING,
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

export default Payment;
