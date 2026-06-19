// src/repositories/paymentRepository.js
// Thin wrapper around the Payment Mongoose model.

import Payment from '../models/Payment.js';

const paymentRepository = {
  async create(data, opts = {}) {
    const [doc] = await Payment.create([data], opts);
    return doc;
  },

  async findById(id, projection = null, opts = {}) {
    return Payment.findById(id, projection, opts).lean();
  },

  async findOne(filter, projection = null, opts = {}) {
    return Payment.findOne(filter, projection, opts).lean();
  },

  async find(filter = {}, projection = null, opts = {}) {
    const { limit = 20, skip = 0, sort = { createdAt: -1 }, session } = opts;
    return Payment.find(filter, projection, { limit, skip, sort, session }).lean();
  },

  async updateOne(filter, update, opts = {}) {
    return Payment.updateOne(filter, update, opts);
  },

  async aggregate(pipeline, opts = {}) {
    return Payment.aggregate(pipeline, opts);
  },

  async countDocuments(filter = {}) {
    return Payment.countDocuments(filter);
  },
};

export default paymentRepository;
