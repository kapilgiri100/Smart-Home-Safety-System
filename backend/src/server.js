require("dotenv").config();
const http = require("http");
const app = require("./app");
const pool = require("./config/db");
const { initSocket } = require("./config/socket");

const requiredEnv = ["JWT_SECRET", "DEVICE_API_KEY"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
const dbConfigured =
  process.env.DATABASE_URL ||
  (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE);

if (missingEnv.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnv.join(", ")}. ` +
    `Copy backend/.env.example to backend/.env and fill in the values.`
  );
  process.exit(1);
}

if (!dbConfigured) {
  console.error(
    "Database configuration is missing. Set DATABASE_URL or PGHOST, PGUSER, PGPASSWORD, and PGDATABASE in backend/.env."
  );
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    await pool.initializeDatabase();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Smart Home backend listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();
