const gradingModel = require('./model');
const examModel = require('../exams/model');
const { invalidateExamCaches } = require('../analytics/controller');

async function getSubmission(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (isNaN(examId)) return res.status(400).json({ error: 'Invalid exam ID' });

    const submission = await gradingModel.getSubmission(examId, req.user.id);
    res.json({ submission: submission || null });
  } catch (err) {
    console.error('getSubmission error:', err);
    res.status(500).json({ error: 'Failed to get submission' });
  }
}

async function autosave(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (isNaN(examId)) return res.status(400).json({ error: 'Invalid exam ID' });

    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers object is required' });
    }

    // Ensure student is enrolled
    const enrollment = await examModel.getEnrollment(examId, req.user.id);
    if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this exam' });

    // Enforce time bounds
    const exam = await examModel.getExamById(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    
    if (now < start) {
      return res.status(403).json({ error: 'Exam has not started yet' });
    }
    
    // Allow 5 minutes grace period for late submissions due to network latency
    const endGrace = new Date(end.getTime() + 5 * 60000);
    if (now > endGrace) {
      return res.status(403).json({ error: 'Exam window has closed' });
    }

    const submission = await gradingModel.saveAnswers(examId, req.user.id, answers);
    res.json({ message: 'Progress saved', submission });
  } catch (err) {
    console.error('autosave error:', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
}

async function submit(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (isNaN(examId)) return res.status(400).json({ error: 'Invalid exam ID' });

    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers object is required' });
    }

    // Ensure student is enrolled
    const enrollment = await examModel.getEnrollment(examId, req.user.id);
    if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this exam' });

    // Enforce time bounds
    const exam = await examModel.getExamById(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    
    if (now < start) {
      return res.status(403).json({ error: 'Exam has not started yet' });
    }
    
    // Allow 5 minutes grace period for late submissions
    const endGrace = new Date(end.getTime() + 5 * 60000);
    if (now > endGrace) {
      return res.status(403).json({ error: 'Exam window has closed' });
    }

    // Prevent double submission
    const existing = await gradingModel.getSubmission(examId, req.user.id);
    if (existing?.submitted_at) {
      return res.status(409).json({ error: 'Exam already submitted' });
    }

    const submission = await gradingModel.submitExam(examId, req.user.id, answers);

    // Invalidate cached analytics for this exam/student
    await invalidateExamCaches(examId, req.user.id).catch(() => {});

    res.json({ message: 'Exam submitted successfully', score: submission.score, submission });
  } catch (err) {
    console.error('submit error:', err);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
}

module.exports = { getSubmission, autosave, submit };
