const db = require('../../db');

async function createUser(name, email, passwordHash, role) {
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash, role]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

async function findUserById(id) {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.role, u.class_id, u.created_at,
            c.grade AS class_grade, c.section AS class_section
     FROM users u
     LEFT JOIN classes c ON u.class_id = c.id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0];
}

async function listAllStudents() {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.class_id, u.created_at,
            c.grade AS class_grade, c.section AS class_section
     FROM users u
     LEFT JOIN classes c ON u.class_id = c.id
     WHERE u.role = 'student'
     ORDER BY u.name ASC`
  );
  return result.rows;
}

async function setResetToken(email, token, expiresAt) {
  const result = await db.query(
    `UPDATE users SET reset_token = $1, reset_expires = $2 WHERE email = $3 RETURNING id, email`,
    [token, expiresAt, email]
  );
  return result.rows[0];
}

async function findUserByResetToken(token) {
  const result = await db.query(
    `SELECT * FROM users WHERE reset_token = $1`,
    [token]
  );
  return result.rows[0];
}

async function updateUserPassword(id, newHash) {
  const result = await db.query(
    `UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2 RETURNING id`,
    [newHash, id]
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  listAllStudents,
  setResetToken,
  findUserByResetToken,
  updateUserPassword,
};
