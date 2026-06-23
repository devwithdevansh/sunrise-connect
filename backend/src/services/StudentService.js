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
      const allMonths = [
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

      const admissionMonth = student.admissionMonth || 'June';
      const startMonthIndex = allMonths.findIndex(m => m.name === admissionMonth);
      const startIndex = startMonthIndex >= 0 ? startMonthIndex : 0;
      const months = allMonths.slice(startIndex);

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
        if (!transportStruct) {
          throw new AppError(`Active transport fee structure not found for ${student.transportType}`, 404);
        }
        transportAmount = transportStruct.amount;
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
      const allTerms = [
        { name: 'Term 1', dueDate: '2026-06-15' },
        { name: 'Term 2', dueDate: '2026-10-15' }
      ];
      const terms = startIndex > 5 ? [allTerms[1]] : allTerms;
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
          feePeriod: 'One-time',
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
          feePeriod: 'One-time',
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
      const student = await studentRepository.findById(studentId);
      if (!student) throw new AppError('Student not found', 404);

      const oldTransport = student.transportType;
      const newTransport = updates.transportType;
      const transportMonths = updates.transportMonths;
      delete updates.transportMonths;

      await studentRepository.updateOne({ _id: studentId }, { $set: updates }, { session });

      // Fetch Active Academic Year
      const activeYear = await mongoose.model('AcademicYear').findOne({ isActive: true }).session(session);
      let currentAcademicYearName = activeYear ? activeYear.name : '2025-26';

      // We only do transport adjustments if transportType changed
      if (newTransport && newTransport !== oldTransport) {
        const transportCategory = await mongoose.model('FeeCategory').findOne({ type: 'TRANSPORT' }).session(session);

        if (transportCategory) {
          let oldRate = 0;
          let newRate = 0;

          if (oldTransport !== 'None') {
            const oldStruct = await mongoose.model('TransportFeeStructure').findOne({ transportType: oldTransport }).session(session);
            if (!oldStruct) {
              throw new AppError(`Transport fee structure not found for ${oldTransport}`, 404);
            }
            oldRate = oldStruct.amount;
          }
          if (newTransport !== 'None') {
            const newStruct = await mongoose.model('TransportFeeStructure').findOne({ transportType: newTransport, isActive: true }).session(session);
            if (!newStruct) {
              throw new AppError(`Active transport fee structure not found for ${newTransport}`, 404);
            }
            newRate = newStruct.amount;
          }

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

          const allMonthsStr = months.map(m => m.name);
          const admissionIdx = allMonthsStr.indexOf(student.admissionMonth || 'June');
          const startIndex = Math.max(0, admissionIdx);

          const existingLedgers = await mongoose.model('StudentFeeLedger').find({
            studentId: student._id,
            feeType: 'TRANSPORT'
          }).session(session);

          const existingPeriods = new Set(existingLedgers.map(l => l.feePeriod));
          const ledgersToCreate = [];

          for (let i = startIndex; i < 12; i++) {
            const m = months[i];
            
            if (newTransport !== 'None') {
              if (existingPeriods.has(m.name)) {
                // UPDATE existing pending ledger for this month
                const ledger = existingLedgers.find(l => l.feePeriod === m.name);
                if (ledger && ledger.status !== 'PAID') {
                  const paidSoFar = ledger.paidAmount || 0;
                  ledger.totalAmount = newRate;
                  ledger.remainingAmount = Math.max(0, newRate - paidSoFar - (ledger.concessionAmount || 0));
                  if (ledger.remainingAmount === 0) {
                    ledger.status = 'PAID';
                  } else if (paidSoFar > 0) {
                    ledger.status = 'PARTIAL';
                  } else {
                    ledger.status = 'PENDING';
                  }
                  await ledger.save({ session });
                }
              } else {
                // CREATE new ledger for this month
                ledgersToCreate.push({
                  studentId: student._id,
                  feePeriod: m.name,
                  feeType: 'TRANSPORT',
                  totalAmount: newRate,
                  paidAmount: 0,
                  concessionAmount: 0,
                  remainingAmount: newRate,
                  dueDate: new Date(m.dueDate),
                  status: 'PENDING',
                  feeCategoryId: transportCategory._id,
                  academicYear: currentAcademicYearName,
                  source: 'MANUAL',
                  generatedFrom: 'TRANSPORT_STRUCTURE',
                  ledgerNumber: `LEDGER_TRA_MID_${m.name.toUpperCase()}_${student.studentCode || student._id}_${Date.now()}`,
                  snapshot: {
                    studentName: student.studentName,
                    medium: student.medium,
                    standard: student.standard,
                    division: student.division,
                    transportType: newTransport,
                    isRTE: student.isRTE
                  }
                });
              }
            } else {
              // STOP transport: cancel remaining unpaid ledgers
              if (existingPeriods.has(m.name)) {
                const ledger = existingLedgers.find(l => l.feePeriod === m.name);
                if (ledger && ledger.status !== 'PAID') {
                  ledger.status = 'CANCELLED';
                  ledger.remainingAmount = 0;
                  await ledger.save({ session });
                }
              }
            }
          }

          if (ledgersToCreate.length > 0) {
            await mongoose.model('StudentFeeLedger').create(ledgersToCreate, { session });
          }
          await AuditService.log({ performedBy: null, targetStudentId: studentId, action: 'LEDGER_CREATED', details: { type: 'TRANSPORT_MID_YEAR_SYNC' } }, session);
        }
      }

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

  /** Hard Delete a student and cascade delete ledgers and payments */
  static async deleteStudent(studentId, performedBy) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const student = await studentRepository.findById(studentId);
      if (!student) throw new AppError('Student not found', 404);

      // Find all ledgers for this student
      const ledgers = await mongoose.model('StudentFeeLedger').find({ studentId }).session(session);
      const ledgerIds = ledgers.map(l => l._id);

      // Delete all payments associated with these ledgers
      if (ledgerIds.length > 0) {
        await mongoose.model('Payment').deleteMany({ ledgerId: { $in: ledgerIds } }, { session });
      }

      // Delete all ledgers
      await mongoose.model('StudentFeeLedger').deleteMany({ studentId }, { session });

      // Delete student
      await studentRepository.deleteOne({ _id: studentId }, { session });

      // Audit log
      await AuditService.log(
        { performedBy, targetStudentId: studentId, action: 'STUDENT_DELETED', details: { studentCode: student.studentCode, studentName: student.studentName } },
        session
      );

      await session.commitTransaction();
      return true;
    } catch (e) {
      await session.abortTransaction();
      logger.error('StudentService.deleteStudent error', e);
      throw e;
    } finally {
      session.endSession();
    }
  }

  /** Promote students to a new standard */
  static async promoteStudents(studentIds, targetStandard, targetDivision, targetAcademicYear, performedBy) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const students = await studentRepository.find({ _id: { $in: studentIds } }, null, { session });
      if (!students.length) throw new AppError('No valid students found', 404);

      const updatedStudentIds = [];
      for (const student of students) {
        await studentRepository.updateOne(
          { _id: student._id },
          { $set: { standard: targetStandard, division: targetDivision } },
          { session }
        );
        updatedStudentIds.push(student._id);
        
        await AuditService.log(
          { performedBy, targetStudentId: student._id, action: 'STUDENT_UPDATED', details: { reason: 'Promotion', targetStandard, targetDivision, targetAcademicYear } },
          session
        );
      }

      await session.commitTransaction();
      return { message: `${updatedStudentIds.length} students promoted successfully` };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error promoting students:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /** Regenerate missing fee ledgers for a student (backfill for legacy data) */
  static async regenerateMissingLedgers(studentId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const student = await studentRepository.findById(studentId);
      if (!student) throw new AppError('Student not found', 404);

      const isRTE = student.isRTE || false;

      // Fetch categories
      const educationCategory = await mongoose.model('FeeCategory').findOne({ type: 'EDUCATION' }).session(session);
      const transportCategory = await mongoose.model('FeeCategory').findOne({ type: 'TRANSPORT' }).session(session);
      const termCategory = await mongoose.model('FeeCategory').findOne({ type: 'TERM' }).session(session);
      const admissionCategory = await mongoose.model('FeeCategory').findOne({ type: 'ADMISSION' }).session(session);
      const bagKitCategory = await mongoose.model('FeeCategory').findOne({ type: 'OTHER' }).session(session);

      // Fetch fee structures
      const feeStruct = await mongoose.model('FeeStructure').findOne(
        { medium: student.medium, standard: student.standard, isActive: true },
        null,
        { session }
      );
      const educationAmount = feeStruct ? Math.round(feeStruct.annualFee / ((feeStruct.educationPartCount || 12) + (feeStruct.termPartCount || 2))) : 0;
      const termAmount = feeStruct?.termFee ?? 0;
      const admissionAmount = feeStruct?.admissionFee ?? 0;
      const bagKitAmount = feeStruct?.bagKitFee ?? 0;

      let transportAmount = 0;
      if (student.transportType && student.transportType !== 'None') {
        const tfs = await mongoose.model('TransportFeeStructure').findOne(
          { transportType: student.transportType, isActive: true },
          null,
          { session }
        );
        transportAmount = tfs?.amount ?? 0;
      }

      // Get existing ledgers for this student
      const existingLedgers = await mongoose.model('StudentFeeLedger').find({ studentId: student._id }).session(session);
      const existingKey = (feeType, feePeriod) => existingLedgers.some(l => l.feeType === feeType && l.feePeriod === feePeriod);

      const allMonths = [
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

      const admissionMonth = student.admissionMonth || 'June';
      const startMonthIndex = allMonths.findIndex(m => m.name === admissionMonth);
      const startIndex = startMonthIndex >= 0 ? startMonthIndex : 0;
      const months = allMonths.slice(startIndex);

      const allTerms = [
        { name: 'Term 1', dueDate: '2026-06-15' },
        { name: 'Term 2', dueDate: '2026-12-15' }
      ];
      const terms = startIndex > 5 ? [allTerms[1]] : allTerms;

      const snapshot = {
        studentName: student.studentName,
        medium: student.medium,
        standard: student.standard,
        division: student.division,
        transportType: student.transportType || 'None',
        isRTE: isRTE
      };

      const ledgersToCreate = [];
      let created = 0;

      // 1. Education ledgers (12 months)
      if (educationCategory) {
        for (const m of months) {
          if (!existingKey('EDUCATION', m.name)) {
            ledgersToCreate.push({
              studentId: student._id,
              feePeriod: m.name,
              feeType: 'EDUCATION',
              totalAmount: educationAmount,
              paidAmount: 0,
              concessionAmount: isRTE ? educationAmount : 0,
              remainingAmount: isRTE ? 0 : educationAmount,
              dueDate: new Date(m.dueDate),
              status: isRTE ? 'PAID' : 'PENDING',
              feeCategoryId: educationCategory._id,
              academicYear: '2025-26',
              source: 'MANUAL',
              generatedFrom: 'FEE_STRUCTURE',
              ledgerNumber: `LEDGER_EDU_${m.name.toUpperCase()}_${student.studentCode || student._id}`,
              snapshot
            });
          }
        }
      }

      // 2. Transport ledgers (12 months, if applicable)
      if (transportCategory && student.transportType && student.transportType !== 'None') {
        for (const m of months) {
          if (!existingKey('TRANSPORT', m.name)) {
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
              snapshot
            });
          }
        }
      }

      // 3. Term ledgers
      if (termCategory) {
        for (const t of terms) {
          if (!existingKey('TERM', t.name)) {
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
              snapshot
            });
          }
        }
      }

      // 4. Admission & Bag Kit (only for new admissions)
      if (student.isNewAdmission) {
        // Check both legacy ("Admission") and new ("One-time") period names
        if (admissionCategory && !existingKey('ADMISSION', 'One-time') && !existingKey('ADMISSION', 'Admission')) {
          ledgersToCreate.push({
            studentId: student._id,
            feePeriod: 'One-time',
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
            snapshot
          });
        }

        if (bagKitCategory && !existingKey('BAG_KIT', 'One-time') && !existingKey('BAG_KIT', 'Bag & Kit')) {
          ledgersToCreate.push({
            studentId: student._id,
            feePeriod: 'One-time',
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
            snapshot
          });
        }
      }

      if (ledgersToCreate.length > 0) {
        await mongoose.model('StudentFeeLedger').insertMany(ledgersToCreate, { session });
        created = ledgersToCreate.length;
      }

      await AuditService.log(
        { performedBy: null, targetStudentId: studentId, action: 'LEDGER_CREATED', details: { type: 'REGENERATE_MISSING', count: created } },
        session
      );

      await session.commitTransaction();
      return { created, studentId };
    } catch (e) {
      await session.abortTransaction();
      logger.error('StudentService.regenerateMissingLedgers error', e);
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   * Adds a custom fee ledger for a student.
   * Uses the OTHER fee category type.
   */
  static async addCustomFee(studentId, feeName, amount) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const student = await mongoose.model('Student').findById(studentId).session(session);
      if (!student) throw new ApiError(404, 'Student not found');

      let otherCategory = await mongoose.model('FeeCategory').findOne({ type: 'OTHER' }).session(session);
      if (!otherCategory) {
        otherCategory = await mongoose.model('FeeCategory').create([{
          name: 'Custom Fee',
          type: 'OTHER',
          isActive: true
        }], { session }).then(res => res[0]);
      }

      const activeAcademicYear = await mongoose.model('AcademicYear').findOne({ isActive: true }).session(session);
      const academicYearStr = activeAcademicYear ? activeAcademicYear.name : '2025-26';

      const ledger = {
        studentId: student._id,
        feePeriod: feeName,
        feeType: 'OTHER',
        totalAmount: amount,
        paidAmount: 0,
        concessionAmount: 0,
        remainingAmount: amount,
        dueDate: new Date(),
        status: 'PENDING',
        feeCategoryId: otherCategory._id,
        academicYear: academicYearStr,
        source: 'MANUAL',
        generatedFrom: 'FEE_STRUCTURE',
        ledgerNumber: `LEDGER_CUST_${Date.now()}_${student.studentCode || student._id}`,
        snapshot: {
          studentName: student.studentName,
          medium: student.medium,
          standard: student.standard,
          division: student.division,
          transportType: student.transportType,
          isRTE: student.isRTE
        }
      };

      await mongoose.model('StudentFeeLedger').create([ledger], { session });

      await AuditService.log({
        performedBy: null,
        targetStudentId: studentId,
        action: 'LEDGER_CREATED',
        details: { type: 'CUSTOM_FEE', name: feeName, amount }
      }, session);

      await session.commitTransaction();
      return ledger;
    } catch (error) {
      await session.abortTransaction();
      logger.error('StudentService.addCustomFee error', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /** Bulk import students from excel data */
  static async importStudents(studentsArray) {
    if (!Array.isArray(studentsArray)) {
      throw new Error('Invalid input data format: expected an array of students');
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < studentsArray.length; i++) {
      const rowNum = i + 1;
      const data = studentsArray[i];

      try {
        if (!data.studentName || typeof data.studentName !== 'string' || !data.studentName.trim()) {
          throw new Error('Student name is required');
        }
        if (!data.medium || !['English', 'Gujarati'].includes(data.medium)) {
          throw new Error(`Medium must be 'English' or 'Gujarati' (got '${data.medium || ''}')`);
        }
        if (!data.standard) {
          throw new Error('Standard is required');
        }
        if (!data.division) {
          throw new Error('Division is required');
        }
        
        data.studentName = data.studentName.trim();
        data.standard = String(data.standard).trim();
        data.division = String(data.division).trim().toUpperCase();

        if (data.transportType) {
          data.transportType = String(data.transportType).trim();
          if (!['Railnagar', 'Outside Railnagar', 'None'].includes(data.transportType)) {
            throw new Error(`Transport Type must be 'Railnagar', 'Outside Railnagar', or 'None'`);
          }
        } else {
          data.transportType = 'None';
        }

        const parseBool = (val) => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') {
            const normalized = val.toLowerCase().trim();
            return normalized === 'true' || normalized === 'yes' || normalized === '1';
          }
          if (typeof val === 'number') return val === 1;
          return false;
        };

        data.isRTE = parseBool(data.isRTE);
        data.isNewAdmission = parseBool(data.isNewAdmission);

        if (data.parentMobile) {
          data.parentMobile = String(data.parentMobile).replace(/\D/g, '');
          if (data.parentMobile.length > 10) {
            data.parentMobile = data.parentMobile.slice(-10);
          }
          if (!/^[6-9]\d{9}$/.test(data.parentMobile)) {
            throw new Error('Enter Indian number or invalid number');
          }
        } else {
          throw new Error('Parent mobile number is required');
        }

        if (data.parentSecondaryMobile) {
          data.parentSecondaryMobile = String(data.parentSecondaryMobile).replace(/\D/g, '');
          if (data.parentSecondaryMobile.length > 10) {
            data.parentSecondaryMobile = data.parentSecondaryMobile.slice(-10);
          }
          if (!/^[6-9]\d{9}$/.test(data.parentSecondaryMobile)) {
            throw new Error('Enter Indian number or invalid number');
          }
        }

        const student = await StudentService.createStudent(data);

        results.push({
          row: rowNum,
          studentName: data.studentName,
          status: 'success',
          studentCode: student.studentCode,
          id: student._id
        });
        successCount++;
      } catch (err) {
        let errMsg = err.message;
        if (err.code === 11000) {
          if (err.keyPattern && err.keyPattern.studentCode) {
            errMsg = 'Duplicate student code';
          } else {
            errMsg = 'Duplicate student: this parent already has a student with the same name and medium';
          }
        }
        results.push({
          row: rowNum,
          studentName: data.studentName || `Row ${rowNum}`,
          status: 'failed',
          error: errMsg
        });
        failCount++;
      }
    }

    return {
      successCount,
      failCount,
      results
    };
  }
}

export default StudentService;
