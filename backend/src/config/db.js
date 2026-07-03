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

module.exports = pool;
