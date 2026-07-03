const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or malformed authorization header." });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// Separate check for the ESP32 device, which authenticates with a static key
// instead of a user JWT.
function deviceAuthMiddleware(req, res, next) {
  const key = req.headers["x-device-key"];

  if (!key || key !== process.env.DEVICE_API_KEY) {
    return res.status(401).json({ message: "Invalid device key." });
  }

  next();
}

module.exports = { authMiddleware, deviceAuthMiddleware };
