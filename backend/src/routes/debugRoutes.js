const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/db", async (req, res) => {
  try {
    // Force a real connection/test.
    await pool.query("SELECT 1 AS ok");
    res.json({ connected: true });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

module.exports = router;

