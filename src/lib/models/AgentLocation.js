import mongoose from 'mongoose';

const AgentLocationSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Shipment ID is required'],
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Agent ID is required'],
      index: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    accuracy: {
      type: Number,
      min: [0, 'Accuracy must be a positive number'],
      default: null,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high-performance latest-location and chronological history queries
AgentLocationSchema.index({ shipmentId: 1, recordedAt: -1 });
AgentLocationSchema.index({ agentId: 1, recordedAt: -1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models?.AgentLocation) {
  delete mongoose.models.AgentLocation;
}

const AgentLocation =
  mongoose.models.AgentLocation || mongoose.model('AgentLocation', AgentLocationSchema);

export default AgentLocation;
