const express = require("express");
const { receiveDeviceUpdate } = require("../controllers/esp32Controller");
const { deviceAuthMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/update", deviceAuthMiddleware, receiveDeviceUpdate);

module.exports = router;
