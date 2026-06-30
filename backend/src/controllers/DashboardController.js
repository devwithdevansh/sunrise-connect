// src/controllers/DashboardController.js
import DashboardService from '../services/DashboardService.js';
import catchAsync from '../utils/catchAsync.js';
import sendResponse from '../utils/response.js';
import mongoose from 'mongoose';
import studentRepository from '../repositories/studentRepository.js';
import ledgerRepository from '../repositories/ledgerRepository.js';
import paymentRepository from '../repositories/paymentRepository.js';
import AcademicYear from '../models/AcademicYear.js';
import FeeCategory from '../models/FeeCategory.js';
import FeeStructure from '../models/FeeStructure.js';
import TransportFeeStructure from '../models/TransportFeeStructure.js';
import AuditLog from '../models/AuditLog.js';

class DashboardController {
  /** GET /api/v1/dashboard/system */
  static systemMetrics = catchAsync(async (req, res) => {
    const data = await DashboardService.getSystemMetrics();
    sendResponse(res, 200, data);
  });

  /** GET /api/v1/dashboard/parent/:id */
  static parentDashboard = catchAsync(async (req, res) => {
    const data = await DashboardService.getParentDashboard(req.params.id);
    sendResponse(res, 200, data);
  });

  /** GET /api/v1/dashboard/student/:id */
  static studentDashboard = catchAsync(async (req, res) => {
    const data = await DashboardService.getStudentDashboard(req.params.id);
    sendResponse(res, 200, data);
  });

  /** GET /api/v1/dashboard/init — BFF bundle endpoint to reduce parallel requests */
  static initDashboard = catchAsync(async (req, res) => {
    const [
      students,
      ledgers,
      transactions,
      feeStructures,
      transportStructures,
      auditLogs,
      academicYears,
      feeCategories
    ] = await Promise.all([
      studentRepository.find({}, null, { limit: 50000 }),
      ledgerRepository.find({}, null, { limit: 50000 }),
      paymentRepository.find({}, null, { limit: 10000, sort: { createdAt: -1 } }),
      FeeStructure.find({ isActive: true }).lean(),
      TransportFeeStructure.find({ isActive: true }).lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(100).lean(),
      AcademicYear.find({}).sort({ startDate: -1 }).lean(),
      FeeCategory.find({}).sort({ order: 1 }).lean()
    ]);

    sendResponse(res, 200, {
      students,
      ledgers,
      transactions,
      feeStructures,
      transportStructures,
      auditLogs,
      academicYears,
      feeCategories
    });
  });

  /** GET /api/v1/dashboard/sync-state */
  static getSyncState = catchAsync(async (req, res) => {
    const latestLog = await AuditLog.findOne().sort({ createdAt: -1 }).select('createdAt');
    const timestamp = latestLog ? latestLog.createdAt.getTime() : 0;
    sendResponse(res, 200, { timestamp });
  });
}

export default DashboardController;
