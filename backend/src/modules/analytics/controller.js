const analyticsModel = require('./model');
const { cached, invalidate } = require('../../redis');

const CACHE_TTL = 300; // 5 minutes

// GET /api/analytics/exams/:examId/student/:studentId/result
async function getStudentResult(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    const studentId = parseInt(req.params.studentId, 10);
    if (isNaN(examId) || isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid exam or student ID' });
    }

    // Students can only view their own results
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const cacheKey = `analytics:student_result:${examId}:${studentId}`;
    const result = await cached(cacheKey, CACHE_TTL, () =>
      analyticsModel.getStudentExamResult(examId, studentId)
    );

    if (!result) {
      return res.status(404).json({ error: 'No submission found' });
    }

    res.json(result);
  } catch (err) {
    console.error('getStudentResult error:', err);
    res.status(500).json({ error: 'Failed to get student result' });
  }
}

// GET /api/analytics/exams/:examId
async function getExamAnalytics(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const cacheKey = `analytics:exam:${examId}`;
    const result = await cached(cacheKey, CACHE_TTL, () =>
      analyticsModel.getExamAnalytics(examId)
    );

    res.json(result);
  } catch (err) {
    console.error('getExamAnalytics error:', err);
    res.status(500).json({ error: 'Failed to get exam analytics' });
  }
}

// GET /api/analytics/exams/:examId/student/:studentId/integrity
async function getStudentIntegrity(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    const studentId = parseInt(req.params.studentId, 10);
    if (isNaN(examId) || isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid exam or student ID' });
    }

    const cacheKey = `analytics:integrity:${examId}:${studentId}`;
    const result = await cached(cacheKey, CACHE_TTL, () =>
      analyticsModel.getStudentIntegrity(examId, studentId)
    );

    res.json({ flags, snapshotUrl, events: mergedTimeline, aiSummary });
  } catch (err) {
    console.error('getStudentIntegrity error:', err);
    res.status(500).json({ error: 'Failed to fetch student integrity data' });
  }
}

// GET /api/analytics/student/me/results
async function getMyResults(req, res) {
  try {
    const studentId = req.user.id;
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Students only' });
    }
    
    // 1. Get all submissions for the student that have been submitted
    const submissions = await analyticsModel.listSubmissionsForStudent(studentId);
    const completedSubmissions = submissions.filter(s => s.submitted_at);
    
    // 2. We need the exam details for each submission. Since listSubmissionsForStudent only returns submission data, 
    // let's fetch exams for this student to get title and dates.
    const examModel = require('../exams/model');
    const exams = await examModel.listExamsForStudent(studentId);
    
    // 3. Map submissions to exams
    const results = completedSubmissions.map(sub => {
      const exam = exams.find(e => e.id === sub.exam_id);
      return {
        id: exam?.id, // using exam.id as the key for frontend routing consistency
        exam_id: sub.exam_id,
        title: exam ? exam.title : 'Unknown Exam',
        start_time: exam ? exam.start_time : null,
        end_time: exam ? exam.end_time : null,
        score: sub.score,
        // Since we want this to be lightweight, we'll let the frontend keep using the existing 
        // per-exam result endpoint if it wants deeper details, OR we could fetch full result here.
        // Actually, the current frontend fetches individual results per exam card. 
        // We will just return the array of exams that have been submitted.
      };
    }).filter(e => e.title !== 'Unknown Exam');

    res.json({ results });
  } catch (err) {
    console.error('getMyResults error:', err);
    res.status(500).json({ error: 'Failed to fetch student results' });
  }
}

// Called after submission to invalidate relevant caches
async function invalidateExamCaches(examId, studentId) {
  await invalidate(`analytics:exam:${examId}`);
  await invalidate(`analytics:student_result:${examId}:${studentId}`);
  await invalidate(`analytics:integrity:${examId}:${studentId}`);
}

// PUT /api/analytics/exams/:examId/student/:studentId/score
async function updateStudentScore(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    const studentId = parseInt(req.params.studentId, 10);
    if (isNaN(examId) || isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid exam or student ID' });
    }

    const { score } = req.body;
    if (score === undefined || isNaN(parseInt(score, 10))) {
      return res.status(400).json({ error: 'Score is required' });
    }

    const updated = await analyticsModel.updateStudentScore(examId, studentId, parseInt(score, 10));
    if (!updated) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Invalidate caches
    await invalidateExamCaches(examId, studentId);

    res.json({ message: 'Score updated successfully', score: updated.score });
  } catch (err) {
    console.error('updateStudentScore error:', err);
    res.status(500).json({ error: 'Failed to update score' });
  }
}

module.exports = {
  getStudentResult,
  getExamAnalytics,
  getStudentIntegrity,
  getMyResults,
  updateStudentScore,
  invalidateExamCaches,
};
