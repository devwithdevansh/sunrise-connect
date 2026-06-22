// src/services/StudentService.js
// Service layer for Student entity – frozen architecture compliance
// No password reset for students (not part of requirements)

import mongoose from 'mongoose';
import studentRepository from '../repositories/studentRepository.js';
import AuditService from './AuditService.js';
import logger from '../config/logger.js';
import AppError from '../utils/AppError.js';

class StudentService {
  /** Create a new student */
  static async createStudent(data) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let parentId = data.parentId;
      if (!parentId && data.parentMobile) {
        // Normalize mobile number: extract digits
        let mobile = data.parentMobile.replace(/\D/g, '');
        if (mobile.length > 10) {
          mobile = mobile.slice(-10);
        }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
          mobile = '9' + mobile.padEnd(9, '0').slice(0, 9);
        }
        
        let parent = await mongoose.model('Parent').findOne({ primaryMobileNumber: mobile }, null, { session });
        if (!parent) {
          const newParent = {
            parentName: data.parentName || `Parent of ${data.studentName}`,
            primaryMobileNumber: mobile,
            passwordHash: 'hashedpassword',
            isActive: true
          };
          if (data.parentSecondaryMobile) {
            let secMobile = data.parentSecondaryMobile.replace(/\D/g, '');
            if (secMobile.length > 10) secMobile = secMobile.slice(-10);
            if (!/^[6-9]\d{9}$/.test(secMobile)) {
              secMobile = '9' + secMobile.padEnd(9, '0').slice(0, 9);
            }
            newParent.secondaryMobileNumber = secMobile;
          }

          parent = await mongoose.model('Parent').create([newParent], { session }).then(docs => docs[0]);
        }
        parentId = parent._id;
      }

      let studentCode = data.studentCode;
      if (!studentCode) {
        const count = await mongoose.model('Student').countDocuments({}, { session });
        const rand = Math.floor(10 + Math.random() * 90);
        studentCode = `STU${String(count + 1).padStart(3, '0')}-${rand}`;
      }

      const studentData = {
        ...data,
        studentCode,
        parentId
      };

      const student = await studentRepository.create(studentData, { session });
      await AuditService.log(
        { performedBy: null, targetStudentId: student._id, action: 'STUDENT_CREATED', details: {} },
        session
      );

      // --- Generate all categories of fee ledgers for the entire academic year ---
      let educationCategory = await mongoose.model('FeeCategory').findOne({ type: 'EDUCATION' }, null, { session });
      if (!educationCategory) {
        educationCategory = await mongoose.model('FeeCategory').create([{
          name: 'Education',
          type: 'EDUCATION',
          description: 'Education fee category',
          isActive: true
        }], { session }).then(docs => docs[0]);
      }

      let transportCategory = await mongoose.model('FeeCategory').findOne({ type: 'TRANSPORT' }, null, { session });
      if (!transportCategory) {
        transportCategory = await mongoose.model('FeeCategory').create([{
          name: 'Transport',
          type: 'TRANSPORT',
          description: 'Transport fee category',
          isActive: true
        }], { session }).then(docs => docs[0]);
      }

      let termCategory = await mongoose.model('FeeCategory').findOne({ type: 'TERM' }, null, { session });
      if (!termCategory) {
        termCategory = await mongoose.model('FeeCategory').create([{
          name: 'Term',
          type: 'TERM',
          description: 'Term fee category',
          isActive: true
        }], { session }).then(docs => docs[0]);
      }

      let admissionCategory = await mongoose.model('FeeCategory').findOne({ type: 'ADMISSION' }, null, { session });
      if (!admissionCategory) {
        admissionCategory = await mongoose.model('FeeCategory').create([{
          name: 'Admission',
          type: 'ADMISSION',
          description: 'Admission fee category',
          isActive: true
        }], { session }).then(docs => docs[0]);
      }

      let bagKitCategory = await mongoose.model('FeeCategory').findOne({ type: 'OTHER' }, null, { session });
      if (!bagKitCategory) {
        bagKitCategory = await mongoose.model('FeeCategory').create([{
          name: 'Bag & Kit',
          type: 'OTHER',
          description: 'Bag & Kit fee category',
          isActive: true
        }], { session }).then(docs => docs[0]);
      }

      const ledgersToCreate = [];
      const months = [
        { name: 'June', dueDate: '2026-06-15' },
        { name: 'July', dueDate: '2026-07-15' },
        { name: 'August', dueDate: '2026-08-15' },
        { name: 'September', dueDate: '2026-09-15' },
        { name: 'October', dueDate: '2026-10-15' },
        { name: 'November', dueDate: '2026-11-15' },
        { name: 'December', dueDate: '2026-12-15' },
        { name: 'January', dueDate: '2027-01-15' },
        { name: 'February', dueDate: '2027-02-15' },
        { name: 'March', dueDate: '2027-03-15' },
        { name: 'April', dueDate: '2027-04-15' },
        { name: 'May', dueDate: '2027-05-15' }
      ];

      // --- Fetch dynamic fee amounts from FeeStructure collection ---
      const feeStruct = await mongoose.model('FeeStructure').findOne(
        { medium: student.medium, standard: student.standard, isActive: true },
        null,
        { session }
      );
      // Derive per-part amounts from annualFee (fallback to previous hardcoded defaults)
      const eduPartCount = feeStruct?.educationPartCount || 12;
      const termPartCount = feeStruct?.termPartCount || 2;
      const annualFee = feeStruct?.annualFee || (student.medium === 'English' ? 36000 : 30000);
      const totalParts = eduPartCount + termPartCount; // 12 + 2 = 14 parts
      const eduAmount = Math.round(annualFee / totalParts);
      
      // Term fee, Admission fee, Bag & Kit fee are now admin-editable fields stored in FeeStructure.
      // We check if they are set (greater than 0), otherwise we fall back to proportional calculations for backward compatibility.
      const termAmount = (feeStruct?.termFee !== undefined && feeStruct?.termFee > 0)
        ? feeStruct.termFee
        : Math.round(annualFee / totalParts);

      const admissionAmount = (feeStruct?.admissionFee !== undefined && feeStruct?.admissionFee > 0)
        ? feeStruct.admissionFee
        : Math.round(annualFee * 0.07);

      const bagKitAmount = (feeStruct?.bagKitFee !== undefined && feeStruct?.bagKitFee > 0)
        ? feeStruct.bagKitFee
        : Math.round(annualFee * 0.05);

      // --- Fetch transport amount from TransportFeeStructure ---
      let transportAmount = 0;
      if (student.transportType && student.transportType !== 'None') {
        const transportStruct = await mongoose.model('TransportFeeStructure').findOne(
          { transportType: student.transportType, isActive: true },
          null,
          { session }
        );
        transportAmount = transportStruct?.amount || (student.transportType === 'Railnagar' ? 600 : 900);
      }

      const isRTE = student.isRTE || false;

      // 1. Education ledgers (12 months)
      for (const m of months) {
        ledgersToCreate.push({
          studentId: student._id,
          feePeriod: m.name,
          feeType: 'EDUCATION',
          totalAmount: eduAmount,
          paidAmount: 0,
          concessionAmount: isRTE ? eduAmount : 0,
          remainingAmount: isRTE ? 0 : eduAmount,
          dueDate: new Date(m.dueDate),
          status: isRTE ? 'PAID' : 'PENDING',
          feeCategoryId: educationCategory._id,
          academicYear: '2025-26',
          source: 'MANUAL',
          generatedFrom: 'FEE_STRUCTURE',
          ledgerNumber: `LEDGER_EDU_${m.name.toUpperCase()}_${student.studentCode || student._id}`,
          snapshot: {
            studentName: student.studentName,
            medium: student.medium,
            standard: student.standard,
            division: student.division,
            transportType: student.transportType || 'None',
            isRTE: isRTE
          }
        });
      }

      // 2. Transport ledgers (12 months, if applicable)
      if (student.transportType && student.transportType !== 'None') {
        for (const m of months) {
          ledgersToCreate.push({
            studentId: student._id,
            feePeriod: m.name,
            feeType: 'TRANSPORT',
            totalAmount: transportAmount,
            paidAmount: 0,
            concessionAmount: 0,
            remainingAmount: transportAmount,
            dueDate: new Date(m.dueDate),
            status: 'PENDING',
            feeCategoryId: transportCategory._id,
            academicYear: '2025-26',
            source: 'MANUAL',
            generatedFrom: 'TRANSPORT_STRUCTURE',
            ledgerNumber: `LEDGER_TRA_${m.name.toUpperCase()}_${student.studentCode || student._id}`,
            snapshot: {
              studentName: student.studentName,
              medium: student.medium,
              standard: student.standard,
              division: student.division,
              transportType: student.transportType,
              isRTE: isRTE
            }
          });
        }
      }

      // 3. Term ledgers (Term 1 & Term 2)
      const terms = [
        { name: 'Term 1', dueDate: '2026-06-15' },
        { name: 'Term 2', dueDate: '2026-10-15' }
      ];
      for (const t of terms) {
        ledgersToCreate.push({
          studentId: student._id,
          feePeriod: t.name,
          feeType: 'TERM',
          totalAmount: termAmount,
          paidAmount: 0,
          concessionAmount: isRTE ? termAmount : 0,
          remainingAmount: isRTE ? 0 : termAmount,
          dueDate: new Date(t.dueDate),
          status: isRTE ? 'PAID' : 'PENDING',
          feeCategoryId: termCategory._id,
          academicYear: '2025-26',
          source: 'MANUAL',
          generatedFrom: 'FEE_STRUCTURE',
          ledgerNumber: `LEDGER_TRM_${t.name.replace(' ', '').toUpperCase()}_${student.studentCode || student._id}`,
          snapshot: {
            studentName: student.studentName,
            medium: student.medium,
            standard: student.standard,
            division: student.division,
            transportType: student.transportType || 'None',
            isRTE: isRTE
          }
        });
      }

      // 4. Admission ledger & 5. Bag & Kit ledger (only for new admissions)
      if (student.isNewAdmission) {
        ledgersToCreate.push({
          studentId: student._id,
          feePeriod: 'Admission',
          feeType: 'ADMISSION',
          totalAmount: admissionAmount,
          paidAmount: 0,
          concessionAmount: 0,
          remainingAmount: admissionAmount,
          dueDate: new Date('2026-06-15'),
          status: 'PENDING',
          feeCategoryId: admissionCategory._id,
          academicYear: '2025-26',
          source: 'MANUAL',
          generatedFrom: 'FEE_STRUCTURE',
          ledgerNumber: `LEDGER_ADM_${student.studentCode || student._id}`,
          snapshot: {
            studentName: student.studentName,
            medium: student.medium,
            standard: student.standard,
            division: student.division,
            transportType: student.transportType || 'None',
            isRTE: isRTE
          }
        });

        ledgersToCreate.push({
          studentId: student._id,
          feePeriod: 'Bag & Kit',
          feeType: 'BAG_KIT',
          totalAmount: bagKitAmount,
          paidAmount: 0,
          concessionAmount: 0,
          remainingAmount: bagKitAmount,
          dueDate: new Date('2026-06-15'),
          status: 'PENDING',
          feeCategoryId: bagKitCategory._id,
          academicYear: '2025-26',
          source: 'MANUAL',
          generatedFrom: 'FEE_STRUCTURE',
          ledgerNumber: `LEDGER_BAG_${student.studentCode || student._id}`,
          snapshot: {
            studentName: student.studentName,
            medium: student.medium,
            standard: student.standard,
            division: student.division,
            transportType: student.transportType || 'None',
            isRTE: isRTE
          }
        });
      }


      await mongoose.model('StudentFeeLedger').insertMany(ledgersToCreate, { session });

      await session.commitTransaction();
      return student;
    } catch (err) {
      await session.abortTransaction();
      logger.error('StudentService.createStudent error', err);
      throw err;
    } finally {
      session.endSession();
    }
  }

  /** Update mutable fields */
  static async updateStudent(studentId, updates) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await studentRepository.updateOne({ _id: studentId }, { $set: updates }, { session });
      await AuditService.log(
        { performedBy: null, targetStudentId: studentId, action: 'STUDENT_UPDATED', details: updates },
        session
      );
      await session.commitTransaction();
      return studentRepository.findById(studentId);
    } catch (e) {
      await session.abortTransaction();
      logger.error('StudentService.updateStudent error', e);
      throw e;
    } finally {
      session.endSession();
    }
  }

  /** Retrieve a student (read‑only) */
  static async getStudent(studentId) {
    const student = await studentRepository.findById(studentId);
    if (!student) throw new AppError('Student not found', 404);
    return student;
  }

  /** List students with optional filtering */
  static async listStudents(filter = {}, pagination = { limit: 20, skip: 0 }) {
    return studentRepository.find(filter, null, pagination);
  }
}

export default StudentService;
