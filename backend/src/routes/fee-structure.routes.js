// src/routes/fee-structure.routes.js
import { Router } from 'express';
import FeeStructureController from '../controllers/FeeStructureController.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  updateFeeStructureSchema,
  updateTransportFeeStructureSchema,
} from '../validations/fee-structure.schema.js';

const router = Router();

// GET /api/v1/fee-structures — returns active fee + transport structures
router.get('/', FeeStructureController.list);

// PUT /api/v1/fee-structures/:id — updates standard fee structure
router.put('/:id', validate(updateFeeStructureSchema), FeeStructureController.updateFeeStructure);

// PUT /api/v1/fee-structures/transport/:id — updates transport fee structure
router.put('/transport/:id', validate(updateTransportFeeStructureSchema), FeeStructureController.updateTransportFeeStructure);

export default router;
