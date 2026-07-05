const { Pool } = require("pg");

// Single shared connection pool for the whole app.
// Uses DATABASE_URL if set, otherwise falls back to discrete PG* vars.
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
      host: process.env.PGHOST || "localhost",
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "password",
      database: process.env.PGDATABASE || "smart_home_db",
    }
);

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL client error", err);
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS appliances (
        id SERIAL PRIMARY KEY,
        name VARCHAR(60) UNIQUE NOT NULL,
        status BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sensors (
        id SERIAL PRIMARY KEY,
        fire_status BOOLEAN NOT NULL DEFAULT FALSE,
        gas_status BOOLEAN NOT NULL DEFAULT FALSE,
        water_level NUMERIC(5,2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE sensors
      ADD COLUMN IF NOT EXISTS water_level NUMERIC(5,2) NOT NULL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        event TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      INSERT INTO appliances (name, status)
      VALUES ('Light', FALSE), ('Fan', FALSE), ('TV', FALSE), ('Smart Socket', FALSE)
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO sensors (fire_status, gas_status, water_level)
      SELECT FALSE, FALSE, 0
      WHERE NOT EXISTS (SELECT 1 FROM sensors);
    `);
  } finally {
    client.release();
  }
}

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
