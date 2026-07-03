const express = require("express");
const { getActivity } = require("../controllers/activityController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getActivity);

module.exports = router;
