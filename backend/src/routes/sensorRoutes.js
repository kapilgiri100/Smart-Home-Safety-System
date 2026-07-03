const express = require("express");
const { getSensorStatus } = require("../controllers/sensorController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getSensorStatus);

module.exports = router;
