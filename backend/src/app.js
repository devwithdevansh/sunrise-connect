import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import logger from './config/logger.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { AppError } from './utils/AppError.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Sunrise Connect Backend is running' });
});

// Mount Routes Here
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/fees', feeRoutes);

// Unhandled Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
