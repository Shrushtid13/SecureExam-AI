const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres123@localhost:5432/secureexam';

const pool = new Pool({
  connectionString: databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected error on inactive database client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
