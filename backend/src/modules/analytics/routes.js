const express = require('express');
const controller = require('./controller');
const { requireAuth, requireRole } = require('../../middleware/requireAuth');

const router = express.Router();

// GET /api/analytics/exams/:examId — per-exam analytics (teacher/admin only)
router.get(
  '/exams/:examId',
  requireAuth,
  requireRole('teacher', 'admin'),
  controller.getExamAnalytics
);

// GET /api/analytics/exams/:examId/student/:studentId/result — per-student result
router.get(
  '/exams/:examId/student/:studentId/result',
  requireAuth,
  controller.getStudentResult
);

// PUT /api/analytics/exams/:examId/student/:studentId/score — update score (teacher/admin)
router.put(
  '/exams/:examId/student/:studentId/score',
  requireAuth,
  requireRole('teacher', 'admin'),
  controller.updateStudentScore
);

// GET /api/analytics/exams/:examId/student/:studentId/integrity — integrity timeline
router.get(
  '/exams/:examId/student/:studentId/integrity',
  requireAuth,
  requireRole('teacher', 'admin'),
  controller.getStudentIntegrity
);

module.exports = router;
