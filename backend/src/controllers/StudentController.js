// src/controllers/StudentController.js
import StudentService from '../services/StudentService.js';
import catchAsync from '../utils/catchAsync.js';
import sendResponse from '../utils/response.js';

class StudentController {
  /** POST /api/v1/students */
  static createStudent = catchAsync(async (req, res) => {
    const student = await StudentService.createStudent(req.body);
    sendResponse(res, 201, student);
  });

  /** GET /api/v1/students */
  static listStudents = catchAsync(async (req, res) => {
    const { limit = 20, skip = 0, ...filter } = req.query;
    const students = await StudentService.listStudents(filter, { limit: Number(limit), skip: Number(skip) });
    sendResponse(res, 200, students);
  });

  /** GET /api/v1/students/:id */
  static getStudent = catchAsync(async (req, res) => {
    const student = await StudentService.getStudent(req.params.id);
    sendResponse(res, 200, student);
  });

  /** PATCH /api/v1/students/:id */
  static updateStudent = catchAsync(async (req, res) => {
    const student = await StudentService.updateStudent(req.params.id, req.body);
    sendResponse(res, 200, student);
  });

  /** DELETE /api/v1/students/:id */
  static deleteStudent = catchAsync(async (req, res) => {
    await StudentService.deleteStudent(req.params.id, req.user.id);
    sendResponse(res, 200, null, 'Student successfully deleted');
  });

  /** POST /api/v1/students/:id/regenerate-ledgers */
  static regenerateLedgers = catchAsync(async (req, res) => {
    const result = await StudentService.regenerateMissingLedgers(req.params.id);
    sendResponse(res, 200, result, `Regenerated ${result.created} missing ledgers`);
  });
}

export default StudentController;
