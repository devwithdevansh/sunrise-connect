// src/routes/student.routes.js
import { Router } from 'express';
import StudentController from '../controllers/StudentController.js';
import authenticate from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/authorize.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createStudentSchema,
  updateStudentSchema,
  listStudentsSchema,
} from '../validations/student.schema.js';

const router = Router();

// router.use(authenticate); // disabled for dev

router.post('/', validate(createStudentSchema), StudentController.createStudent);
router.get('/',     validate(listStudentsSchema),  StudentController.listStudents);
router.get('/:id',  StudentController.getStudent);
router.patch('/:id', validate(updateStudentSchema), StudentController.updateStudent);

export default router;
