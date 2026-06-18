// src/controllers/FeeStructureController.js
import FeeStructure from '../models/FeeStructure.js';
import TransportFeeStructure from '../models/TransportFeeStructure.js';
import catchAsync from '../utils/catchAsync.js';
import sendResponse from '../utils/response.js';
import AppError from '../utils/AppError.js';

class FeeStructureController {
  /**
   * GET /api/v1/fee-structures
   * Returns all active fee structures and transport fee structures
   * so the frontend can dynamically price every fee category.
   */
  static list = catchAsync(async (_req, res) => {
    const [feeStructures, transportStructures] = await Promise.all([
      FeeStructure.find({ isActive: true }).lean(),
      TransportFeeStructure.find({ isActive: true }).lean(),
    ]);

    sendResponse(res, 200, { feeStructures, transportStructures });
  });

  /**
   * PUT /api/v1/fee-structures/:id
   * Updates standard fee structure (e.g. annualFee, parts counts)
   */
  static updateFeeStructure = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updated = await FeeStructure.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) {
      throw new AppError('Fee structure not found', 404);
    }
    sendResponse(res, 200, updated);
  });

  /**
   * PUT /api/v1/fee-structures/transport/:id
   * Updates transport fee structure (e.g. amount)
   */
  static updateTransportFeeStructure = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updated = await TransportFeeStructure.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) {
      throw new AppError('Transport fee structure not found', 404);
    }
    sendResponse(res, 200, updated);
  });
}

export default FeeStructureController;
