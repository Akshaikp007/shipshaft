import mongoose from 'mongoose';
import { ALL_SHIPMENT_STATUSES } from '@/lib/constants/shipmentStatus';

const TrackingEventSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Shipment ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ALL_SHIPMENT_STATUSES,
        message: 'Invalid tracking event status: {VALUE}',
      },
      required: [true, 'Event status is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // Tracking events are immutable historical event records
    timestamps: false,
  }
);

const TrackingEvent =
  mongoose.models.TrackingEvent || mongoose.model('TrackingEvent', TrackingEventSchema);

export default TrackingEvent;
