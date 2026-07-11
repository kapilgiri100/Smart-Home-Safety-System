require("dotenv").config();
const http = require("http");
const app = require("./app");
const pool = require("./config/db");
const { initSocket } = require("./config/socket");
const { executeDueSchedules } = require("./controllers/scheduleController");


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

    // Scheduler runtime: check every 20 seconds for due schedules at exact HH:MM.
    // In-memory guard prevents re-running the same schedule more than once per minute.
    const lastRunKey = new Map(); // key: `${scheduleId}-${dateISO}-${HHMM}`
    const interval = setInterval(async () => {
      try {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const dueNowHHmm = `${hh}:${mm}`;

        // Find due & enabled schedules for this HH:MM.
        const { rows: due } = await pool.query(
          `SELECT s.id
           FROM schedules s
           WHERE s.enabled = TRUE AND s.time_hhmm = $1`,
          [dueNowHHmm]
        );

        const dateISO = now.toISOString().slice(0, 10);
        const runnableIds = due.map((r) => r.id).filter((scheduleId) => {
          const key = `${scheduleId}-${dateISO}-${dueNowHHmm}`;
          if (lastRunKey.get(key)) return false;
          lastRunKey.set(key, true);
          return true;
        });

        if (runnableIds.length === 0) return;

        // Execute only the schedules that passed the in-memory guard.
        // This prevents re-running all enabled schedules at the same HH:MM.
        await executeDueSchedules(dueNowHHmm, runnableIds);
      } catch (e) {
        console.error("Scheduler error:", e);
      }
    }, 20000);


    server.listen(PORT, () => {
      console.log(`Smart Home backend listening on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();
