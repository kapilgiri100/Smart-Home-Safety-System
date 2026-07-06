const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeWaterLevel, buildSensorResponse, getPumpAction, getSensorActivityMessages } = require("../src/controllers/sensorController");

test("normalizeWaterLevel clamps values into a 0-100 range", () => {
    assert.equal(normalizeWaterLevel(-5), 0);
    assert.equal(normalizeWaterLevel(120), 100);
    assert.equal(normalizeWaterLevel(64.4), 64);
});

test("buildSensorResponse exposes a numeric water level", () => {
    const response = buildSensorResponse({
        id: 1,
        fireStatus: false,
        gasStatus: false,
        waterLevel: 82,
        updatedAt: "2026-01-01T00:00:00.000Z",
    });

    assert.equal(response.waterLevel, 82);
    assert.equal(response.fireStatus, false);
    assert.equal(response.gasStatus, false);
});

test("getPumpAction turns the pump on below 20 percent and off at 100 percent", () => {
    assert.equal(getPumpAction(15, false), "ON");
    assert.equal(getPumpAction(100, false), "OFF");
    assert.equal(getPumpAction(50, true), "MANUAL");
});

test("getSensorActivityMessages includes water events", () => {
    const messages = getSensorActivityMessages({ fireStatus: false, gasStatus: false, waterLevel: 15 });
    assert.deepEqual(messages, ["💧 Water level low — pump activated"]);
});
