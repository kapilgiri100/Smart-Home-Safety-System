const pool = require("../config/db");
const { getIO } = require("../config/socket");

const SELECT_SENSOR = `id, fire_status AS "fireStatus", gas_status AS "gasStatus", water_level AS "waterLevel", updated_at AS "updatedAt"`;

function normalizeWaterLevel(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildSensorResponse(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fireStatus: Boolean(row.fireStatus),
    gasStatus: Boolean(row.gasStatus),
    waterLevel: normalizeWaterLevel(Number(row.waterLevel ?? 0)),
    updatedAt: row.updatedAt,
  };
}

function getPumpAction(waterLevel, manualOverride = false) {
  if (manualOverride) {
    return "MANUAL";
  }
  if (waterLevel <= 20) {
    return "ON";
  }
  if (waterLevel >= 100) {
    return "OFF";
  }
  return "IDLE";
}

async function getSensorStatus(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${SELECT_SENSOR} FROM sensors ORDER BY id DESC LIMIT 1`
    );
    res.json(buildSensorResponse(rows[0]));
  } catch (err) {
    next(err);
  }
}

// Called by the ESP32 device/update handler whenever the flame or MQ-2 gas
// sensor readings change.
async function syncSensorFromDevice({ fireStatus, gasStatus, waterLevel }) {
  const existing = await pool.query("SELECT id FROM sensors ORDER BY id DESC LIMIT 1");

  let sensor;
  if (existing.rows[0]) {
    const { rows } = await pool.query(
      `UPDATE sensors
       SET fire_status = $1, gas_status = $2, water_level = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING ${SELECT_SENSOR}`,
      [fireStatus, gasStatus, normalizeWaterLevel(waterLevel), existing.rows[0].id]
    );
    sensor = rows[0];
  } else {
    const { rows } = await pool.query(
      `INSERT INTO sensors (fire_status, gas_status, water_level)
       VALUES ($1, $2, $3)
       RETURNING ${SELECT_SENSOR}`,
      [fireStatus, gasStatus, normalizeWaterLevel(waterLevel)]
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

  getIO().emit("sensor:update", buildSensorResponse(sensor));
  return buildSensorResponse(sensor);
}

module.exports = { getSensorStatus, syncSensorFromDevice, normalizeWaterLevel, buildSensorResponse, getPumpAction };
