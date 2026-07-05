const { syncApplianceFromDevice } = require("./deviceController");
const { syncSensorFromDevice } = require("./sensorController");
const pool = require("../config/db");
const { getIO } = require("../config/socket");

// POST /api/device/update
// Body sent by the ESP32 on every state change:
// {
//   "appliances": { "Light": true, "Fan": false, "TV": false, "Smart Socket": true },
//   "fireStatus": false,
//   "gasStatus": false
// }
async function receiveDeviceUpdate(req, res, next) {
  try {
    const { appliances = {}, fireStatus, gasStatus, waterLevel } = req.body;

    const updatedAppliances = [];
    for (const [name, status] of Object.entries(appliances)) {
      if (typeof status === "boolean") {
        updatedAppliances.push(await syncApplianceFromDevice(name, status));
      }
    }

    let sensor = null;
    if (typeof fireStatus === "boolean" || typeof gasStatus === "boolean") {
      const { rows } = await pool.query(
        'SELECT fire_status AS "fireStatus", gas_status AS "gasStatus", water_level AS "waterLevel" FROM sensors ORDER BY id DESC LIMIT 1'
      );
      const current = rows[0];
      sensor = await syncSensorFromDevice({
        fireStatus: typeof fireStatus === "boolean" ? fireStatus : current?.fireStatus ?? false,
        gasStatus: typeof gasStatus === "boolean" ? gasStatus : current?.gasStatus ?? false,
        waterLevel: typeof waterLevel === "number" ? waterLevel : current?.waterLevel ?? 0,
      });
    }

    // Let the dashboard know the ESP32 is alive and just reported in
    getIO().emit("device:heartbeat", { timestamp: new Date().toISOString() });

    res.json({ appliances: updatedAppliances, sensor });
  } catch (err) {
    next(err);
  }
}

module.exports = { receiveDeviceUpdate };
