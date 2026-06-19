// src/controllers/PaymentController.js
import PaymentService from '../services/PaymentService.js';
import catchAsync from '../utils/catchAsync.js';
import sendResponse from '../utils/response.js';

class PaymentController {
  /** POST /api/v1/payments */
  static createPayment = catchAsync(async (req, res) => {
    const payment = await PaymentService.createPayment(req.body);
    sendResponse(res, 201, payment);
  });

  /** GET /api/v1/payments */
  static listPayments = catchAsync(async (req, res) => {
    const { limit = 20, skip = 0, ...filter } = req.query;
    const payments = await PaymentService.listPayments(filter, { limit: Number(limit), skip: Number(skip) });
    sendResponse(res, 200, payments);
  });

  /** GET /api/v1/payments/:id */
  static getPayment = catchAsync(async (req, res) => {
    const payment = await PaymentService.getPayment(req.params.id);
    sendResponse(res, 200, payment);
  });

  /** POST /api/v1/payments/:id/reverse (ADMIN only) */
  static reversePayment = catchAsync(async (req, res) => {
    const reversal = await PaymentService.reversePayment({ paymentId: req.params.id, ...req.body });
    sendResponse(res, 200, reversal);
  });
}

export default PaymentController;
