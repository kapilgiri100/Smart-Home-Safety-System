// Lightweight body validator: pass a list of required field names.
// Usage: router.post('/register', validateRequest(['name','email','password']), controller)
function validateRequest(requiredFields = []) {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missing.join(", ")}`,
      });
    }

    next();
  };
}

module.exports = validateRequest;
