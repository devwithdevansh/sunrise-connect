import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TransportFeeStructure from '../src/models/TransportFeeStructure.js';
import AcademicYear from '../src/models/AcademicYear.js';

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let activeYear = await AcademicYear.findOne({ isActive: true });
    const yearStr = activeYear ? activeYear.name : '2025-26';

    const result = await TransportFeeStructure.updateMany(
      { academicYear: { $exists: false } },
      { $set: { academicYear: yearStr } }
    );

    console.log(`Migration completed. Updated ${result.modifiedCount} documents to academicYear: ${yearStr}`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
