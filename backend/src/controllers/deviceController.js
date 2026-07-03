const pool = require("../config/db");
const { getIO } = require("../config/socket");

const SELECT_APPLIANCE = `id, name, status, updated_at AS "updatedAt"`;

async function getAppliances(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${SELECT_APPLIANCE} FROM appliances ORDER BY id ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// Called from the React dashboard when a user clicks an ON/OFF toggle.
async function updateAppliance(req, res, next) {
  try {
    const { id } = req.params;
    const { status, name } = req.body;

    const updates = [];
    const values = [];

    if (typeof status === "boolean") {
      updates.push("status = $" + (values.length + 1));
      values.push(status);
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "'name' must be a non-empty string." });
      }
      updates.push("name = $" + (values.length + 1));
      values.push(name.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update." });
    }

    values.push(id);

    const { rows } = await pool.query(
      `UPDATE appliances
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING ${SELECT_APPLIANCE}`,
      values
    );

    const appliance = rows[0];
    if (!appliance) {
      return res.status(404).json({ message: "Appliance not found." });
    }

    const events = [];
    if (typeof status === "boolean") {
      events.push(`${appliance.name} turned ${status ? "ON" : "OFF"} (via dashboard)`);
    }
    if (name !== undefined) {
      events.push(`Renamed to ${name.trim()} (via dashboard)`);
    }

    if (events.length > 0) {
      await pool.query("INSERT INTO activity_logs (event) VALUES ($1)", [events.join(" and ")]);
    }

    getIO().emit("appliance:update", appliance);
    res.json(appliance);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Appliance name must be unique." });
    }
    next(err);
  }
}

// Called by the ESP32 itself, either after it confirms a relay change or
// after a physical wall switch flips an appliance's state locally.
async function syncApplianceFromDevice(applianceName, status) {
  const { rows } = await pool.query(
    `UPDATE appliances
     SET status = $1, updated_at = NOW()
     WHERE name = $2
     RETURNING ${SELECT_APPLIANCE}`,
    [status, applianceName]
  );

  const appliance = rows[0];
  if (!appliance) return null;

  await pool.query("INSERT INTO activity_logs (event) VALUES ($1)", [
    `${appliance.name} turned ${status ? "ON" : "OFF"} (physical switch)`,
  ]);

  getIO().emit("appliance:update", appliance);
  return appliance;
}

module.exports = { getAppliances, updateAppliance, syncApplianceFromDevice };
