const express = require('express');
const proctoringController = require('./controller');
const { requireAuth, requireRole } = require('../../middleware/requireAuth');
const { autosaveLimiter } = require('../../middleware/rateLimit');

const router = express.Router({ mergeParams: true }); // Need mergeParams to access examId if mounted as /api/exams/:examId/proctoring

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/exams/:examId/proctoring/flag
router.post('/flag', requireAuth, requireRole('student'), proctoringController.logFlag);

// POST /api/exams/:examId/proctoring/snapshot
router.post('/snapshot', requireAuth, requireRole('student'), autosaveLimiter, upload.fields([{ name: 'snapshot', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), proctoringController.processSnapshot);

// GET /api/exams/:examId/proctoring
router.get('/', requireAuth, requireRole('teacher', 'admin'), proctoringController.getFlagsForExam);

// GET /api/exams/:examId/proctoring/severities
router.get('/severities', requireAuth, requireRole('teacher', 'admin'), proctoringController.getSeverities);

// POST /api/exams/:examId/proctoring/generate-summary
router.post('/generate-summary', requireAuth, requireRole('teacher', 'admin'), proctoringController.generateSummary);

module.exports = router;
