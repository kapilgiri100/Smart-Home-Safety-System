const pool = require("../config/db");

async function getActivity(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const { rows } = await pool.query(
      `SELECT id, event, created_at AS "createdAt"
       FROM activity_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { getActivity };
