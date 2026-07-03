const express = require("express");
const { getAppliances, updateAppliance } = require("../controllers/deviceController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getAppliances);
router.put("/:id", authMiddleware, updateAppliance);

module.exports = router;
