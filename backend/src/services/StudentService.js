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
      const student = await studentRepository.create(data, { session });
      await AuditService.log(
        { performedBy: null, targetStudentId: student._id, action: 'STUDENT_CREATED', details: {} },
        session
      );
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
