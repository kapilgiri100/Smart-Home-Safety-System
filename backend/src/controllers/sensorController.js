const pool = require("../config/db");
const { getIO } = require("../config/socket");

const SELECT_SENSOR = `id, fire_status AS "fireStatus", gas_status AS "gasStatus", updated_at AS "updatedAt"`;

async function getSensorStatus(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${SELECT_SENSOR} FROM sensors ORDER BY id DESC LIMIT 1`
    );
    res.json(rows[0] || null);
  } catch (err) {
    next(err);
  }
}

// Called by the ESP32 device/update handler whenever the flame or MQ-2 gas
// sensor readings change.
async function syncSensorFromDevice({ fireStatus, gasStatus }) {
  const existing = await pool.query("SELECT id FROM sensors ORDER BY id DESC LIMIT 1");

  let sensor;
  if (existing.rows[0]) {
    const { rows } = await pool.query(
      `UPDATE sensors
       SET fire_status = $1, gas_status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING ${SELECT_SENSOR}`,
      [fireStatus, gasStatus, existing.rows[0].id]
    );
    sensor = rows[0];
  } else {
    const { rows } = await pool.query(
      `INSERT INTO sensors (fire_status, gas_status)
       VALUES ($1, $2)
       RETURNING ${SELECT_SENSOR}`,
      [fireStatus, gasStatus]
    );
    sensor = rows[0];
  }

  if (fireStatus) {
    await pool.query("INSERT INTO activity_logs (event) VALUES ($1)", [
      "🔴 Fire detected by flame sensor",
    ]);
  }
  if (gasStatus) {
    await pool.query("INSERT INTO activity_logs (event) VALUES ($1)", [
      "🔴 Gas leakage detected by MQ-2 sensor",
    ]);
  }

  getIO().emit("sensor:update", sensor);
  return sensor;
}

module.exports = { getSensorStatus, syncSensorFromDevice };
