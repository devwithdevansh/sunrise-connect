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

// router.use(authenticate); // disabled for dev

router.post('/',                validate(createLedgerSchema), LedgerController.createLedger);
router.get('/',                 validate(listLedgersSchema),  LedgerController.listLedgers);
router.get('/:id',              LedgerController.getLedger);
router.post('/:id/payment',     validate(addPaymentSchema),  LedgerController.addPayment);
router.post('/:id/concession',  validate(concessionSchema),            LedgerController.applyConcession);
router.patch('/:id/mark-paid',  LedgerController.markAsPaid);

export default router;
