// src/utils/catchAsync.js
/** Wraps async route handlers and forwards errors to Express next() */
const catchAsync = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
