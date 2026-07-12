const db = require('../../db');

async function logFlag(examId, studentId, source, flagType, detail, snapshotKey) {
  const result = await db.query(
    `INSERT INTO proctoring_flags (exam_id, student_id, source, flag_type, detail, snapshot_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [examId, studentId, source, flagType, detail, snapshotKey]
  );
  return result.rows[0];
}

async function getFlagsForExam(examId) {
  const result = await db.query(
    `SELECT f.id, f.exam_id, f.student_id, f.source, f.flag_type, f.detail, f.snapshot_key, f.created_at,
            u.name as student_name, u.email as student_email
     FROM proctoring_flags f
     JOIN users u ON f.student_id = u.id
     WHERE f.exam_id = $1
     ORDER BY f.created_at DESC`,
    [examId]
  );
  return result.rows;
}

module.exports = {
  logFlag,
  getFlagsForExam,
};
