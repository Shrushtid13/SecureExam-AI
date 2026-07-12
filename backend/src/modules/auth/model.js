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

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  listAllStudents,
};
