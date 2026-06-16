// src/controllers/FeeStructureController.js
import FeeStructure from '../models/FeeStructure.js';
import TransportFeeStructure from '../models/TransportFeeStructure.js';
import catchAsync from '../utils/catchAsync.js';
import sendResponse from '../utils/response.js';

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
}

export default FeeStructureController;
