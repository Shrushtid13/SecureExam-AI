const express = require('express');
const examController = require('./controller');
const { requireAuth, requireRole } = require('../../middleware/requireAuth');

const router = express.Router();

// Exams CRUD
router.post('/', requireAuth, requireRole('teacher', 'admin'), examController.createExam);
router.get('/', requireAuth, examController.listExams);
router.get('/:id', requireAuth, examController.getExam);
router.put('/:id', requireAuth, requireRole('teacher', 'admin'), examController.updateExam);
router.delete('/:id', requireAuth, requireRole('teacher', 'admin'), examController.deleteExam);

// Questions CRUD
router.post('/:examId/questions', requireAuth, requireRole('teacher', 'admin'), examController.createQuestion);
router.put('/:examId/questions/:id', requireAuth, requireRole('teacher', 'admin'), examController.updateQuestion);
router.delete('/:examId/questions/:id', requireAuth, requireRole('teacher', 'admin'), examController.deleteQuestion);

// Enrollments
router.post('/:examId/enroll', requireAuth, requireRole('teacher', 'admin'), examController.enrollStudent);
router.post('/:examId/enroll-bulk', requireAuth, requireRole('teacher', 'admin'), examController.bulkEnrollStudents);
router.get('/:examId/enroll', requireAuth, requireRole('teacher', 'admin'), examController.listEnrollments);

// Students list (for enrollment modal)
router.get('/meta/students', requireAuth, requireRole('teacher', 'admin'), examController.listStudents);

module.exports = router;
