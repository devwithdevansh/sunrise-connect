// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Verify JWT token and attach user payload to request.
 * Expected Authorization header: Bearer <token>
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Missing or malformed Authorization header', 401));
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload; // payload should contain at least { id, role }
    return next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
};
