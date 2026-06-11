// src/config/db.js
import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

/**
 * Initialize MongoDB connection using Mongoose.
 * Returns a promise that resolves when the connection is established.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;
