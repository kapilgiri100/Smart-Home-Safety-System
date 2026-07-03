const express = require("express");
const { register, login, profile } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post("/register", validateRequest(["name", "email", "password"]), register);
router.post("/login", validateRequest(["email", "password"]), login);
router.get("/profile", authMiddleware, profile);

module.exports = router;
