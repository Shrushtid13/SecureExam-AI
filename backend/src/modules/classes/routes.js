const express = require('express');
const classController = require('./controller');
const { requireAuth, requireRole } = require('../../middleware/requireAuth');

const router = express.Router();

// Require teacher or admin for all class routes
router.use(requireAuth, requireRole('teacher', 'admin'));

router.post('/', classController.createClass);
router.get('/', classController.listAllClasses); // all classes
router.get('/my', classController.listClassesByTeacher); // teacher's classes

router.post('/assign-teacher', classController.assignTeacherToClass);

router.get('/:id', classController.getClassDetail);
router.post('/:id/students', classController.addStudent);
router.delete('/:id/students/:studentId', classController.removeStudent);
router.delete('/:id', classController.deleteClass);

module.exports = router;
