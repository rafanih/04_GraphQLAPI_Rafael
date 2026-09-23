const dotenv = require('dotenv');
dotenv.config();

const { Pool: PgPool } = require('pg');

const pool = new PgPool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
