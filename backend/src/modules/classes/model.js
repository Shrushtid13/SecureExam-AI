const db = require('../../db');

async function createClass(grade, section) {
  const result = await db.query(
    `INSERT INTO classes (grade, section)
     VALUES ($1, $2)
     ON CONFLICT (grade, section) DO UPDATE SET grade = EXCLUDED.grade
     RETURNING *`,
    [grade, section]
  );
  return result.rows[0];
}

async function listAllClasses() {
  const result = await db.query('SELECT * FROM classes ORDER BY grade ASC, section ASC');
  return result.rows;
}

async function assignTeacherToClass(teacherId, classId, subject) {
  const result = await db.query(
    `INSERT INTO teacher_classes (teacher_id, class_id, subject)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [teacherId, classId, subject]
  );
  return result.rows[0];
}

async function listClassesByTeacher(teacherId) {
  const result = await db.query(
    `SELECT c.*, tc.subject, tc.id as teacher_class_id
     FROM classes c
     JOIN teacher_classes tc ON c.id = tc.class_id
     WHERE tc.teacher_id = $1
     ORDER BY c.grade ASC, c.section ASC`,
    [teacherId]
  );
  return result.rows;
}

async function getClassById(id) {
  const result = await db.query('SELECT * FROM classes WHERE id = $1', [id]);
  return result.rows[0];
}

async function assignStudentToClass(classId, studentId) {
  const result = await db.query(
    `UPDATE users SET class_id = $1 WHERE id = $2 RETURNING id, name, email, class_id`,
    [classId, studentId]
  );
  return result.rows[0];
}

async function removeStudentFromClass(studentId) {
  const result = await db.query(
    `UPDATE users SET class_id = NULL WHERE id = $1 RETURNING id, name, email`,
    [studentId]
  );
  return result.rows[0];
}

async function listStudentsByClass(classId) {
  const result = await db.query(
    `SELECT id, name, email, created_at FROM users
     WHERE class_id = $1 AND role = 'student'
     ORDER BY name ASC`,
    [classId]
  );
  return result.rows;
}

async function listUnassignedStudents() {
  const result = await db.query(
    `SELECT id, name, email, created_at FROM users
     WHERE class_id IS NULL AND role = 'student'
     ORDER BY name ASC`
  );
  return result.rows;
}

async function deleteClass(id) {
  await db.query('DELETE FROM classes WHERE id = $1', [id]);
}

module.exports = {
  createClass,
  listAllClasses,
  assignTeacherToClass,
  listClassesByTeacher,
  getClassById,
  assignStudentToClass,
  removeStudentFromClass,
  listStudentsByClass,
  listUnassignedStudents,
  deleteClass
};
