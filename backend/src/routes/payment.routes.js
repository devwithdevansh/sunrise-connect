// src/routes/payment.routes.js
import { Router } from 'express';
import PaymentController from '../controllers/PaymentController.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/authorize.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import idempotency from '../middlewares/idempotency.middleware.js';
import {
  createPaymentSchema,
  reversePaymentSchema,
  listPaymentsSchema,
} from '../validations/payment.schema.js';

const router = Router();

router.use(authenticate);

// Idempotency enforced on payment creation to prevent duplicate charges
router.post('/', idempotency, validate(createPaymentSchema), PaymentController.createPayment);
router.get('/', validate(listPaymentsSchema), PaymentController.listPayments);
router.get('/:id', PaymentController.getPayment);
router.post('/:id/reverse', validate(reversePaymentSchema), PaymentController.reversePayment);

export default router;
