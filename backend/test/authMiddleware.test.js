const test = require('node:test');
const assert = require('node:assert/strict');
const { authMiddleware } = require('../src/middleware/authMiddleware');

test('auth middleware accepts the ESP32 device key', () => {
  process.env.DEVICE_API_KEY = 'esp32-secret';

  let nextCalled = false;
  const req = {
    headers: {
      'x-device-key': 'esp32-secret',
    },
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});
