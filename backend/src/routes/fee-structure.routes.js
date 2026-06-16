// src/routes/fee-structure.routes.js
import { Router } from 'express';
import FeeStructureController from '../controllers/FeeStructureController.js';

const router = Router();

// GET /api/v1/fee-structures — returns active fee + transport structures
router.get('/', FeeStructureController.list);

export default router;
