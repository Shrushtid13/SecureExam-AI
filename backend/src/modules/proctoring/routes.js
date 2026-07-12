const express = require('express');
const proctoringController = require('./controller');
const { requireAuth, requireRole } = require('../../middleware/requireAuth');

const router = express.Router({ mergeParams: true }); // Need mergeParams to access examId if mounted as /api/exams/:examId/proctoring

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/exams/:examId/proctoring/flag
router.post('/flag', requireAuth, requireRole('student'), proctoringController.logFlag);

// POST /api/exams/:examId/proctoring/snapshot
router.post('/snapshot', requireAuth, requireRole('student'), upload.fields([{ name: 'snapshot', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), proctoringController.processSnapshot);

// GET /api/exams/:examId/proctoring
router.get('/', requireAuth, requireRole('teacher', 'admin'), proctoringController.getFlagsForExam);

module.exports = router;
