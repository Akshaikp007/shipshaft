import mongoose from 'mongoose';
import { ROLES, ALL_ROLES } from '@/lib/constants/roles';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never exposed by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ALL_ROLES,
        message: 'Invalid user role: {VALUE}',
      },
      default: ROLES.CUSTOMER,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent recompilation in Next.js development hot reload
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
