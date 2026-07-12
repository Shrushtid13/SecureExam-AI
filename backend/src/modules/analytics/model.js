const db = require('../../db');

// ─── Per-Student Result for an Exam ─────────────────────────────────────────
// Returns: score, total possible, time taken, per-question breakdown
async function getStudentExamResult(examId, studentId) {
  const subRes = await db.query(
    'SELECT * FROM submissions WHERE exam_id = $1 AND student_id = $2',
    [examId, studentId]
  );
  const submission = subRes.rows[0];
  if (!submission) return null;

  const qRes = await db.query(
    'SELECT * FROM questions WHERE exam_id = $1 ORDER BY id ASC',
    [examId]
  );
  const questions = qRes.rows;
  const answers = submission.answers || {};

  let totalPossible = 0;
  let earnedScore = 0;
  const breakdown = [];

  for (const q of questions) {
    totalPossible += q.points;
    const studentAnswer = answers[q.id] !== undefined ? String(answers[q.id]) : null;
    let isCorrect = null; // null = subjective (not auto-graded)
    let pointsEarned = 0;

    if (q.type !== 'subjective' && q.correct_answer) {
      const correct = String(q.correct_answer).trim().toLowerCase();
      const given = studentAnswer ? studentAnswer.trim().toLowerCase() : '';
      isCorrect = correct === given;
      pointsEarned = isCorrect ? q.points : 0;
      earnedScore += pointsEarned;
    }

    breakdown.push({
      question_id: q.id,
      type: q.type,
      question_text: q.question_text,
      correct_answer: q.type !== 'subjective' ? q.correct_answer : null,
      student_answer: studentAnswer,
      is_correct: isCorrect,
      points_possible: q.points,
      points_earned: pointsEarned,
    });
  }

  // Time taken (from started_at to submitted_at)
  let timeTakenSeconds = null;
  if (submission.started_at && submission.submitted_at) {
    timeTakenSeconds = Math.round(
      (new Date(submission.submitted_at) - new Date(submission.started_at)) / 1000
    );
  }

  return {
    student_id: studentId,
    exam_id: examId,
    score: earnedScore,
    total_possible: totalPossible,
    percentage: totalPossible > 0 ? Math.round((earnedScore / totalPossible) * 100) : 0,
    time_taken_seconds: timeTakenSeconds,
    submitted_at: submission.submitted_at,
    started_at: submission.started_at,
    breakdown,
  };
}

// ─── Per-Exam Analytics ─────────────────────────────────────────────────────
// Returns: score distribution, average time, flag summary, all submissions
async function getExamAnalytics(examId) {
  // All submitted submissions
  const subRes = await db.query(
    `SELECT s.*, u.name as student_name, u.email as student_email
     FROM submissions s
     JOIN users u ON s.student_id = u.id
     WHERE s.exam_id = $1 AND s.submitted_at IS NOT NULL
     ORDER BY s.score DESC`,
    [examId]
  );
  const submissions = subRes.rows;

  // Questions for total possible
  const qRes = await db.query(
    'SELECT * FROM questions WHERE exam_id = $1 ORDER BY id ASC',
    [examId]
  );
  const questions = qRes.rows;
  const totalPossible = questions.reduce((sum, q) => sum + q.points, 0);

  // Score statistics
  const scores = submissions.map(s => s.score || 0);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;

  // Score distribution (buckets: 0-10%, 10-20%, ... 90-100%)
  const distribution = Array(10).fill(0);
  for (const score of scores) {
    const pct = totalPossible > 0 ? (score / totalPossible) * 100 : 0;
    const bucket = Math.min(Math.floor(pct / 10), 9);
    distribution[bucket]++;
  }

  // Average time per question
  const timeTakens = submissions
    .filter(s => s.started_at && s.submitted_at)
    .map(s => (new Date(s.submitted_at) - new Date(s.started_at)) / 1000);
  const avgTimeSeconds = timeTakens.length > 0
    ? timeTakens.reduce((a, b) => a + b, 0) / timeTakens.length
    : 0;
  const avgTimePerQuestion = questions.length > 0 ? avgTimeSeconds / questions.length : 0;

  // Flag summary
  const flagRes = await db.query(
    `SELECT source, flag_type, COUNT(*)::int as count
     FROM proctoring_flags
     WHERE exam_id = $1
     GROUP BY source, flag_type
     ORDER BY count DESC`,
    [examId]
  );

  // Total enrolled
  const enrollRes = await db.query(
    'SELECT COUNT(*)::int as total FROM enrollments WHERE exam_id = $1',
    [examId]
  );

  return {
    exam_id: examId,
    total_enrolled: enrollRes.rows[0]?.total || 0,
    total_submitted: submissions.length,
    total_possible: totalPossible,
    total_questions: questions.length,
    score_stats: {
      average: Math.round(avgScore * 100) / 100,
      max: maxScore,
      min: minScore,
      average_percentage: totalPossible > 0 ? Math.round((avgScore / totalPossible) * 100) : 0,
    },
    score_distribution: distribution,
    avg_time_seconds: Math.round(avgTimeSeconds),
    avg_time_per_question_seconds: Math.round(avgTimePerQuestion),
    flag_summary: flagRes.rows,
    submissions: submissions.map(s => ({
      student_id: s.student_id,
      student_name: s.student_name,
      student_email: s.student_email,
      score: s.score,
      percentage: totalPossible > 0 ? Math.round(((s.score || 0) / totalPossible) * 100) : 0,
      submitted_at: s.submitted_at,
      started_at: s.started_at,
    })),
  };
}

// ─── Per-Student Integrity View ─────────────────────────────────────────────
// Flag timeline with linked evidence snapshots
async function getStudentIntegrity(examId, studentId) {
  const flagRes = await db.query(
    `SELECT id, source, flag_type, detail, snapshot_key, created_at
     FROM proctoring_flags
     WHERE exam_id = $1 AND student_id = $2
     ORDER BY created_at ASC`,
    [examId, studentId]
  );

  // Summary counts by type
  const summaryCounts = {};
  for (const f of flagRes.rows) {
    const key = `${f.source}:${f.flag_type}`;
    summaryCounts[key] = (summaryCounts[key] || 0) + 1;
  }

  return {
    exam_id: examId,
    student_id: studentId,
    total_flags: flagRes.rows.length,
    summary: Object.entries(summaryCounts).map(([key, count]) => {
      const [source, flag_type] = key.split(':');
      return { source, flag_type, count };
    }),
    timeline: flagRes.rows,
  };
}

module.exports = {
  getStudentExamResult,
  getExamAnalytics,
  getStudentIntegrity,
};
