const pool = require("../config/db");
const { getIO } = require("../config/socket");

function requireNonEmptyArray(arr, fieldName) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return `Must provide a non-empty array for ${fieldName}.`;
  }
  return null;
}

async function getSchedules(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
          s.id,
          s.time_hhmm AS "timeHHmm",
          s.action,
          s.enabled,
          s.created_at AS "createdAt",
          COALESCE(
            json_agg(
              json_build_object('id', a.id, 'name', a.name)
              ORDER BY a.id
            ) FILTER (WHERE a.id IS NOT NULL),
            '[]'::json
          ) AS appliances
        FROM schedules s
        LEFT JOIN schedule_appliances sa ON sa.schedule_id = s.id
        LEFT JOIN appliances a ON a.id = sa.appliance_id
        GROUP BY s.id
        ORDER BY s.id DESC`
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createSchedule(req, res, next) {
  try {
    const { enabled = true, timeHHmm, action, applianceIds } = req.body || {};

    if (typeof timeHHmm !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeHHmm)) {
      return res.status(400).json({ message: "timeHHmm must be in HH:MM 24h format." });
    }

    if (action !== "ON" && action !== "OFF") {
      return res.status(400).json({ message: "action must be 'ON' or 'OFF'." });
    }

    // Frontend sends an array of appliance ids.
    // Ensure we only store real appliance ids and always respond with schedules that include appliance names.
    const nonEmptyErr = requireNonEmptyArray(applianceIds, "applianceIds");
    if (nonEmptyErr) {
      return res.status(400).json({ message: nonEmptyErr });
    }

    // Normalize to unique integers (prevents silent duplicates and bad types).
    const normalizedApplianceIds = Array.from(new Set(
      applianceIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    ));

    if (!normalizedApplianceIds.length) {
      return res.status(400).json({ message: "applianceIds must contain valid appliance ids." });
    }

    const { rows } = await pool.query(
      `INSERT INTO schedules (time_hhmm, action, enabled)
       VALUES ($1, $2, $3)
       RETURNING id, time_hhmm AS "timeHHmm", action, enabled, created_at AS "createdAt"`,
      [timeHHmm, action, enabled]
    );

    const schedule = rows[0];

    await pool.query(
      `INSERT INTO schedule_appliances (schedule_id, appliance_id)
       SELECT $1, unnest($2::int[])`,
      [schedule.id, normalizedApplianceIds]
    );

    const schedules = await getScheduleById(schedule.id);
    res.status(201).json(schedules);
  } catch (err) {
    next(err);
  }
}


async function getScheduleById(id) {
  const { rows } = await pool.query(
    `SELECT
        s.id,
        s.time_hhmm AS "timeHHmm",
        s.action,
        s.enabled,
        s.created_at AS "createdAt",
        COALESCE(
          json_agg(
            json_build_object('id', a.id, 'name', a.name)
            ORDER BY a.id
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'::json
        ) AS appliances
      FROM schedules s
      LEFT JOIN schedule_appliances sa ON sa.schedule_id = s.id
      LEFT JOIN appliances a ON a.id = sa.appliance_id
      WHERE s.id = $1
      GROUP BY s.id`,
    [id]
  );
  return rows[0];
}

async function updateSchedule(req, res, next) {
  try {
    const { id } = req.params;
    const { enabled, timeHHmm, action, applianceIds } = req.body || {};

    const updates = [];
    const values = [];

    if (enabled !== undefined) {
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ message: "enabled must be boolean." });
      }
      updates.push(`enabled = $${values.length + 1}`);
      values.push(enabled);
    }

    if (timeHHmm !== undefined) {
      if (typeof timeHHmm !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeHHmm)) {
        return res.status(400).json({ message: "timeHHmm must be in HH:MM 24h format." });
      }
      updates.push(`time_hhmm = $${values.length + 1}`);
      values.push(timeHHmm);
    }

    if (action !== undefined) {
      if (action !== "ON" && action !== "OFF") {
        return res.status(400).json({ message: "action must be 'ON' or 'OFF'." });
      }
      updates.push(`action = $${values.length + 1}`);
      values.push(action);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE schedules SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${values.length}`,
        values
      );
    }

    if (applianceIds !== undefined) {
      const nonEmptyErr = requireNonEmptyArray(applianceIds, "applianceIds");
      if (nonEmptyErr) {
        return res.status(400).json({ message: nonEmptyErr });
      }

      await pool.query(`DELETE FROM schedule_appliances WHERE schedule_id = $1`, [id]);
      const normalizedApplianceIds = Array.from(new Set(
        applianceIds.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0)
      ));

      if (!normalizedApplianceIds.length) {
        return res.status(400).json({ message: "applianceIds must contain valid appliance ids." });
      }

      await pool.query(
        `INSERT INTO schedule_appliances (schedule_id, appliance_id)
         SELECT $1, unnest($2::int[])`,
        [id, normalizedApplianceIds]
      );
    }


    const schedule = await getScheduleById(id);
    if (!schedule) return res.status(404).json({ message: "Schedule not found." });

    res.json(schedule);
  } catch (err) {
    next(err);
  }
}

async function deleteSchedule(req, res, next) {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM schedule_appliances WHERE schedule_id = $1`, [id]);
    const result = await pool.query(`DELETE FROM schedules WHERE id = $1 RETURNING id`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    res.json({ message: "Deleted." });
  } catch (err) {
    next(err);
  }
}

// Called by scheduler runtime.
async function executeDueSchedules(dueNowHHmm, scheduleIds = null) {
  const { rows: schedules } = await pool.query(
    `SELECT
        s.id,
        s.action,
        COALESCE(
          array_agg(sa.appliance_id ORDER BY sa.appliance_id) FILTER (WHERE sa.appliance_id IS NOT NULL),
          '{}'::int[]
        ) AS appliance_ids
      FROM schedules s
      LEFT JOIN schedule_appliances sa ON sa.schedule_id = s.id
      WHERE s.enabled = TRUE
        AND s.time_hhmm = $1
        ${scheduleIds && Array.isArray(scheduleIds) && scheduleIds.length ? "AND s.id = ANY($2::int[])" : ""}
      GROUP BY s.id, s.action
      HAVING COALESCE(
        array_agg(sa.appliance_id) FILTER (WHERE sa.appliance_id IS NOT NULL),
        '{}'::int[]
      ) <> '{}'::int[]`,
    scheduleIds && Array.isArray(scheduleIds) && scheduleIds.length ? [dueNowHHmm, scheduleIds] : [dueNowHHmm]
  );

  if (!schedules.length) return { executed: 0 };

  let executed = 0;

  for (const s of schedules) {
    const shouldStatus = s.action === "ON";
    const applianceIds = s.appliance_ids || [];
    if (applianceIds.length === 0) continue;

    await pool.query(
      `UPDATE appliances
       SET status = $1, updated_at = NOW()
       WHERE id = ANY($2::int[])`,
      [shouldStatus, applianceIds]
    );

    const { rows: updatedAppliances } = await pool.query(
      `SELECT id, name, status, updated_at AS "updatedAt" FROM appliances WHERE id = ANY($1::int[]) ORDER BY id ASC`,
      [applianceIds]
    );

    // Emit per appliance so the dashboard state updates immediately.
    for (const appliance of updatedAppliances) {
      getIO().emit("appliance:update", appliance);
    }

    await pool.query(
      `INSERT INTO activity_logs (event)
       VALUES ($1)`,
      [
        `Schedule #${s.id} executed: turned ${shouldStatus ? "ON" : "OFF"} for appliances [${applianceIds.join(", ")}] (time ${dueNowHHmm})`,
      ]
    );

    executed++;
  }

  return { executed };
}

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  executeDueSchedules,
};

