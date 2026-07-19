const express = require('express');
const controller = require('./controller');
const { requireAuth, requireRole } = require('../../middleware/requireAuth');
const { autosaveLimiter } = require('../../middleware/rateLimit');
const validate = require('../../middleware/validate');
const { autosaveSchema, submitExamSchema } = require('../../validations');

const router = express.Router({ mergeParams: true });

// GET  /api/submissions/:examId        → get current student's submission
router.get('/:examId', requireAuth, requireRole('student'), controller.getSubmission);

// POST /api/submissions/:examId/autosave → periodic answer autosave
router.post('/:examId/autosave', requireAuth, requireRole('student'), autosaveLimiter, validate(autosaveSchema), controller.autosave);

// POST /api/submissions/:examId/submit   → final submission
router.post('/:examId/submit', requireAuth, requireRole('student'), validate(submitExamSchema), controller.submit);

module.exports = router;
