const db = require('../../db');

// --- Exams CRUD ---

async function createExam(title, durationMinutes, startTime, endTime, createdBy) {
  const result = await db.query(
    `INSERT INTO exams (title, duration_minutes, start_time, end_time, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, durationMinutes, startTime, endTime, createdBy]
  );
  return result.rows[0];
}

async function getExamById(id) {
  const result = await db.query('SELECT * FROM exams WHERE id = $1', [id]);
  return result.rows[0];
}

async function listAllExams() {
  const result = await db.query('SELECT * FROM exams ORDER BY created_at DESC');
  return result.rows;
}

async function listExamsByCreator(userId) {
  const result = await db.query(
    'SELECT * FROM exams WHERE created_by = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function listExamsForStudent(studentId) {
  const result = await db.query(
    `SELECT e.* FROM exams e
     JOIN enrollments en ON e.id = en.exam_id
     WHERE en.student_id = $1
     ORDER BY e.start_time ASC`,
    [studentId]
  );
  return result.rows;
}

async function updateExam(id, title, durationMinutes, startTime, endTime) {
  const result = await db.query(
    `UPDATE exams
     SET title = $1, duration_minutes = $2, start_time = $3, end_time = $4
     WHERE id = $5
     RETURNING *`,
    [title, durationMinutes, startTime, endTime, id]
  );
  return result.rows[0];
}

async function deleteExam(id) {
  await db.query('DELETE FROM exams WHERE id = $1', [id]);
}

// --- Questions CRUD ---

async function createQuestion(examId, type, questionText, options, correctAnswer, points) {
  const result = await db.query(
    `INSERT INTO questions (exam_id, type, question_text, options, correct_answer, points)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [examId, type, questionText, options ? JSON.stringify(options) : null, correctAnswer, points]
  );
  return result.rows[0];
}

async function getQuestionById(id) {
  const result = await db.query('SELECT * FROM questions WHERE id = $1', [id]);
  return result.rows[0];
}

async function listQuestionsByExam(examId) {
  const result = await db.query(
    'SELECT * FROM questions WHERE exam_id = $1 ORDER BY id ASC',
    [examId]
  );
  return result.rows;
}

async function updateQuestion(id, type, questionText, options, correctAnswer, points) {
  const result = await db.query(
    `UPDATE questions
     SET type = $1, question_text = $2, options = $3, correct_answer = $4, points = $5
     WHERE id = $6
     RETURNING *`,
    [type, questionText, options ? JSON.stringify(options) : null, correctAnswer, points, id]
  );
  return result.rows[0];
}

async function deleteQuestion(id) {
  await db.query('DELETE FROM questions WHERE id = $1', [id]);
}

// --- Enrollments ---

async function enrollStudent(examId, studentId) {
  const result = await db.query(
    `INSERT INTO enrollments (exam_id, student_id)
     VALUES ($1, $2)
     RETURNING *`,
    [examId, studentId]
  );
  return result.rows[0];
}

async function getEnrollment(examId, studentId) {
  const result = await db.query(
    'SELECT * FROM enrollments WHERE exam_id = $1 AND student_id = $2',
    [examId, studentId]
  );
  return result.rows[0];
}

async function listEnrollmentsByExam(examId) {
  const result = await db.query(
    `SELECT en.*, u.name, u.email FROM enrollments en
     JOIN users u ON en.student_id = u.id
     WHERE en.exam_id = $1`,
    [examId]
  );
  return result.rows;
}

module.exports = {
  createExam,
  getExamById,
  listAllExams,
  listExamsByCreator,
  listExamsForStudent,
  updateExam,
  deleteExam,
  createQuestion,
  getQuestionById,
  listQuestionsByExam,
  updateQuestion,
  deleteQuestion,
  enrollStudent,
  getEnrollment,
  listEnrollmentsByExam,
};
