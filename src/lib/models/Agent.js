import mongoose from 'mongoose';

const AgentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Associated User ID is required'],
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch assignment is required'],
    },
    vehicleType: {
      type: String,
      trim: true,
      default: 'Delivery Van',
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    availability: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
      default: 'AVAILABLE',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRANSIT', 'IDLE', 'OFFLINE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);

export default Agent;
