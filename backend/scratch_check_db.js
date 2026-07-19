import mongoose from 'mongoose';
import dotenv from 'dotenv';
import paymentRepository from './src/repositories/paymentRepository.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  
  // Find a parent
  const parent = await mongoose.connection.db.collection('parents').findOne({});
  if (!parent) { console.log("No parent"); process.exit(0); }
  
  const studentIds = await mongoose.connection.db.collection('students').distinct('_id', { parentId: parent._id });
  console.log("Students:", studentIds);
  
  if (studentIds.length > 0) {
    const sId = studentIds[0];
    const ledgerIds = await mongoose.connection.db.collection('studentfeeledgers').distinct('_id', { studentId: sId });
    console.log("Ledgers for student 1:", ledgerIds);
    
    // Now simulate PaymentController listPayments with studentId
    const filter = { ledgerIds: ledgerIds.map(id => id.toString()).join(',') };
    const payments = await paymentRepository.findWithLedger(filter);
    console.log(`Payments for student 1 (${sId}):`, payments.length);
    for (const p of payments) {
        console.log(`  Payment: ${p._id}, Ledger: ${p.ledgerId}, Amount: ${p.amount}, Receipt: ${p.receiptNumber}`);
    }
  }

  process.exit(0);
}

run().catch(console.error);
