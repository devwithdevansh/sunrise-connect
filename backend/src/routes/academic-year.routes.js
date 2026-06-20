import express from 'express';
import * as academicYearController from '../controllers/AcademicYearController.js';

const router = express.Router();

router
  .route('/')
  .get(academicYearController.getAllAcademicYears)
  .post(academicYearController.createAcademicYear);

router
  .route('/:id')
  .put(academicYearController.updateAcademicYear)
  .delete(academicYearController.deleteAcademicYear);

export default router;
