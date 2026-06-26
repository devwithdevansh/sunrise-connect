// src/middlewares/rateLimit.middleware.js
// Lightweight in-process rate limiter using a sliding-window map.
// For production, replace with redis-backed implementation.
import AppError from '../utils/AppError.js';
import env from '../config/env.js';

/**
 * rateLimit({ windowMs, max })
 * Keyed by IP address (with proxy support).
 */
const rateLimit = ({ windowMs = env.RATE_LIMIT_WINDOW_MS, max = env.RATE_LIMIT_MAX } = {}) => {
  const store = new Map(); // key -> [timestamps] (isolated per limiter instance)
  
  return (req, res, next) => {
    // Get true client IP from proxy headers, fallback to req.ip
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    const key = clientIp || 'unknown';
    
    const now = Date.now();
    const timestamps = (store.get(key) || []).filter(t => now - t < windowMs);
    if (timestamps.length >= max) {
      return next(new AppError('Too many requests. Please try again later.', 429));
    }
    timestamps.push(now);
    store.set(key, timestamps);
    
    // Simple memory cleanup (run occasionally)
    if (store.size > 10000) store.clear();
    
    return next();
  };
};

/** Stricter limiter for auth endpoints */
export const authRateLimit = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 
});

/** Default API limiter */
export const apiRateLimit = rateLimit({ 
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: (env.RATE_LIMIT_MAX * 10) || 1000 // Scale up max limit for standard API calls
});

export default rateLimit;
