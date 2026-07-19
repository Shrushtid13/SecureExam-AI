const db = require('../../db');

// Severity score mapping for each flag type
const SEVERITY_SCORES = {
  'cell_phone_detected': 8,
  'multiple_faces_detected': 5,
  'tab_switch': 4,
  'no_face_detected': 3,
  'look_away': 3,
  'fullscreen_exit': 2,
  'audio_anomaly_detected': 2,
};

function getSeverityScore(flagType) {
  return SEVERITY_SCORES[flagType] || 1;
}

async function logFlag(examId, studentId, source, flagType, detail, snapshotKey) {
  const severityScore = getSeverityScore(flagType);
  const result = await db.query(
    `INSERT INTO proctoring_flags (exam_id, student_id, source, flag_type, detail, snapshot_key, severity_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [examId, studentId, source, flagType, detail, snapshotKey, severityScore]
  );
  return result.rows[0];
}

// Check if a duplicate flag was logged within the last N seconds (deduplication)
async function recentFlagExists(examId, studentId, flagType, withinSeconds = 30) {
  const result = await db.query(
    `SELECT id FROM proctoring_flags
     WHERE exam_id = $1 AND student_id = $2 AND flag_type = $3
       AND created_at > NOW() - INTERVAL '1 second' * $4
     LIMIT 1`,
    [examId, studentId, flagType, withinSeconds]
  );
  return result.rows.length > 0;
}

async function getFlagsForExam(examId) {
  const result = await db.query(
    `SELECT f.id, f.exam_id, f.student_id, f.source, f.flag_type, f.detail,
            f.snapshot_key, f.severity_score, f.created_at,
            u.name as student_name, u.email as student_email
     FROM proctoring_flags f
     JOIN users u ON f.student_id = u.id
     WHERE f.exam_id = $1
     ORDER BY f.created_at DESC`,
    [examId]
  );
  return result.rows;
}

// Per-student flag summary for a given exam
async function getStudentFlagSummary(examId, studentId) {
  const result = await db.query(
    `SELECT flag_type, source, COUNT(*)::int as count,
            SUM(severity_score)::int as total_severity
     FROM proctoring_flags
     WHERE exam_id = $1 AND student_id = $2
     GROUP BY flag_type, source
     ORDER BY total_severity DESC`,
    [examId, studentId]
  );
  const totalResult = await db.query(
    `SELECT COUNT(*)::int as total_flags, COALESCE(SUM(severity_score), 0)::int as total_severity
     FROM proctoring_flags
     WHERE exam_id = $1 AND student_id = $2`,
    [examId, studentId]
  );
  return {
    summary: result.rows,
    total_flags: totalResult.rows[0]?.total_flags || 0,
    total_severity: totalResult.rows[0]?.total_severity || 0,
  };
}

// All students ranked by severity for a given exam (for teacher overview)
async function getAllStudentSeverities(examId) {
  const result = await db.query(
    `SELECT pf.student_id, u.name as student_name, u.email as student_email,
            COUNT(pf.id)::int as total_flags,
            COALESCE(SUM(pf.severity_score), 0)::int as total_severity,
            MAX(pf.created_at) as last_flag_at,
            json_agg(json_build_object(
              'flag_type', pf.flag_type, 'source', pf.source, 'severity_score', pf.severity_score,
              'created_at', pf.created_at
            ) ORDER BY pf.created_at DESC) as flags
     FROM proctoring_flags pf
     JOIN users u ON pf.student_id = u.id
     WHERE pf.exam_id = $1
     GROUP BY pf.student_id, u.name, u.email
     ORDER BY total_severity DESC`,
    [examId]
  );
  return result.rows;
}

module.exports = {
  logFlag,
  recentFlagExists,
  getFlagsForExam,
  getStudentFlagSummary,
  getAllStudentSeverities,
  getSeverityScore,
};
