import mongoose from 'mongoose';
import env from './src/config/env.js';
import './src/models/Student.js';
import './src/models/StudentFeeLedger.js';
import './src/models/AcademicYear.js';
import './src/models/FeeCategory.js';

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const Student = mongoose.model('Student');
  const Ledger = mongoose.model('StudentFeeLedger');
  
  const student = await Student.findOne({ studentName: { $regex: /PANDYA NAVYA/i } });
  if (!student) {
    console.log("Student not found.");
    process.exit(0);
  }
  console.log("Student Object:", JSON.stringify(student, null, 2));
  
  const ledgers = await Ledger.find({ studentId: student._id });
  console.log(`Found ${ledgers.length} ledgers`);
  for (const l of ledgers) {
     console.log(`Ledger ${l.ledgerNumber}: category=${l.feeCategoryId}, period=${l.feePeriod}, type=${l.feeType}, yr=${l.academicYear}, total=${l.totalAmount}, paid=${l.paidAmount}`);
  }
  
  process.exit(0);
}

run().catch(console.error);
