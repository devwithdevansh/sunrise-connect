import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema(
  {
    parentName: {
      type: String,
      required: [true, 'Parent name is required'],
      trim: true,
      maxlength: [100, 'Parent name cannot exceed 100 characters'],
    },
    primaryMobileNumber: {
      type: String,
      required: [true, 'Primary mobile number is required'],
      unique: true, // Essential for login uniqueness
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Please provide a valid primary mobile number'],
    },
    secondaryMobileNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Please provide a valid secondary mobile number'],
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      default: null,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
      default: null,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    isPasswordSet: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Optimized for filtering active vs inactive parents during mass communication
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Indexes

// Secondary Mobile Number Index
// Ensures that if a secondary number (e.g., Mother) is provided, it is completely unique across the platform to avoid login conflicts.
// The partialFilterExpression is critical: it ignores `null` values, preventing duplicate key errors for parents who only provide a primary number.
parentSchema.index(
  { secondaryMobileNumber: 1 },
  { 
    unique: true, 
    partialFilterExpression: { secondaryMobileNumber: { $type: "string" } } 
  }
);

const Parent = mongoose.model('Parent', parentSchema);

export default Parent;
