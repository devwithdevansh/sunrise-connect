import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import env from '../config/env.js';

export const protectAdmin = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // Verify token
  const decoded = jwt.verify(token, env.JWT_SECRET);

  // Check if user still exists, etc.
  // req.user = currentUser;
  
  next();
});
