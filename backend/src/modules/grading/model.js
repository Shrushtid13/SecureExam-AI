const db = require('../../db');
const examModel = require('../exams/model');

// Get or create in-progress submission record
async function getOrCreateSubmission(examId, studentId) {
  const existing = await db.query(
    'SELECT * FROM submissions WHERE exam_id = $1 AND student_id = $2',
    [examId, studentId]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const res = await db.query(
    `INSERT INTO submissions (exam_id, student_id, answers)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [examId, studentId, JSON.stringify({})]
  );
  return res.rows[0];
}

async function getSubmission(examId, studentId) {
  const res = await db.query(
    'SELECT * FROM submissions WHERE exam_id = $1 AND student_id = $2',
    [examId, studentId]
  );
  return res.rows[0];
}

async function saveAnswers(examId, studentId, answers) {
  const res = await db.query(
    `INSERT INTO submissions (exam_id, student_id, answers)
     VALUES ($1, $2, $3)
     ON CONFLICT (exam_id, student_id)
     DO UPDATE SET answers = $3
     RETURNING *`,
    [examId, studentId, JSON.stringify(answers)]
  );
  return res.rows[0];
}

async function submitExam(examId, studentId, answers) {
  // Get all questions to auto-grade objective ones
  const questions = await examModel.listQuestionsByExam(examId);
  let totalScore = 0;

  for (const q of questions) {
    if (q.type === 'subjective') continue;
    const studentAnswer = answers[q.id];
    if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') continue;

    const correct = String(q.correct_answer).trim().toLowerCase();
    const given = String(studentAnswer).trim().toLowerCase();

    if (correct === given) {
      totalScore += q.points;
    }
  }

  const res = await db.query(
    `UPDATE submissions
     SET answers = $3, score = $4, submitted_at = NOW()
     WHERE exam_id = $1 AND student_id = $2
     RETURNING *`,
    [examId, studentId, JSON.stringify(answers), totalScore]
  );

  if (res.rows.length === 0) {
    // If no existing submission, create with score
    const r2 = await db.query(
      `INSERT INTO submissions (exam_id, student_id, answers, score, submitted_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [examId, studentId, JSON.stringify(answers), totalScore]
    );
    return r2.rows[0];
  }

  return res.rows[0];
}

module.exports = { getOrCreateSubmission, getSubmission, saveAnswers, submitExam };
