const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/scheduleController");

const router = express.Router();

router.get("/", authMiddleware, getSchedules);
router.post("/", authMiddleware, createSchedule);
router.put("/:id", authMiddleware, updateSchedule);
router.delete("/:id", authMiddleware, deleteSchedule);

module.exports = router;

