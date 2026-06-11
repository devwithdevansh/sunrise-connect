// src/routes/ledger.routes.js
import { Router } from 'express';
import LedgerController from '../controllers/LedgerController.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/authorize.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createLedgerSchema,
  addPaymentSchema,
  concessionSchema,
  listLedgersSchema,
} from '../validations/ledger.schema.js';

const router = Router();

router.use(authenticate);

router.post('/',                authorize('ADMIN', 'STAFF'), validate(createLedgerSchema), LedgerController.createLedger);
router.get('/',                 authorize('ADMIN', 'STAFF'), validate(listLedgersSchema),  LedgerController.listLedgers);
router.get('/:id',              authorize('ADMIN', 'STAFF', 'parent'), LedgerController.getLedger);
router.post('/:id/payment',     authorize('ADMIN', 'STAFF'), validate(addPaymentSchema),  LedgerController.addPayment);
router.post('/:id/concession',  authorize('ADMIN'), validate(concessionSchema),            LedgerController.applyConcession);
router.patch('/:id/mark-paid',  authorize('ADMIN', 'STAFF'), LedgerController.markAsPaid);

export default router;
