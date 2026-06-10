// src/config/db.js
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

/**
 * Initialize MongoDB connection using Mongoose.
 * Returns a promise that resolves when the connection is established.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  mongoose,
};
