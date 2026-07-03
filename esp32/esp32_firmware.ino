/*
  Guardian - ESP32 Firmware
  Smart Home Automation + Fire & Gas Safety Monitoring

  Responsibilities (matches the backend contract in backend/src/controllers/esp32Controller.js):
    - Read 4 physical switches + drive 4 relays (Light, Fan, TV, Smart Socket)
    - Read flame sensor (digital HIGH = fire) and MQ-2 gas sensor (analog threshold)
    - Drive buzzer + warning LED on any alert
    - POST current state to POST /api/device/update whenever something changes,
      and on a fixed heartbeat interval so the dashboard knows it's alive
    - Poll GET /api/appliances so commands sent from the React dashboard are
      applied to the relays even if the device didn't cause the change

  Wiring (adjust pins to your board):
    Relay 1 (Light)   -> GPIO 14   Switch 1 -> GPIO 27
    Relay 2 (Fan)     -> GPIO 12   Switch 2 -> GPIO 26
    Relay 3 (TV)      -> GPIO 13   Switch 3 -> GPIO 25
    Relay 4 (Socket)  -> GPIO 15   Switch 4 -> GPIO 33
    Flame sensor DO   -> GPIO 34
    MQ-2 gas sensor AO-> GPIO 35
    Buzzer            -> GPIO 32
    Warning LED       -> GPIO 4
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---------- Configuration ----------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_HOST  = "http://192.168.1.100:5000"; // your backend's LAN IP
const char* DEVICE_KEY    = "replace_with_a_long_random_device_key"; // must match backend .env DEVICE_API_KEY

const int GAS_THRESHOLD = 1800; // tune to your MQ-2 + sensitivity pot

// ---------- Pins ----------
const int RELAY_PINS[4]  = {14, 12, 13, 15};
const int SWITCH_PINS[4] = {27, 26, 25, 33};
const char* APPLIANCE_NAMES[4] = {"Light", "Fan", "TV", "Smart Socket"};

const int FLAME_PIN = 34;
const int GAS_PIN    = 35;
const int BUZZER_PIN = 32;
const int LED_PIN    = 4;

// ---------- State ----------
bool applianceState[4] = {false, false, false, false};
bool lastSwitchState[4] = {false, false, false, false};
bool fireStatus = false;
bool gasStatus = false;

unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL_MS = 15000;
unsigned long lastPoll = 0;
const unsigned long POLL_INTERVAL_MS = 2000;

void connectWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nConnected. IP: " + WiFi.localIP().toString());
}

void applyRelay(int index) {
  digitalWrite(RELAY_PINS[index], applianceState[index] ? HIGH : LOW);
}

// POST /api/device/update — reports appliance + sensor state to the backend
void sendDeviceUpdate(bool includeAppliances) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(BACKEND_HOST) + "/api/device/update");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);

  StaticJsonDocument<512> doc;
  if (includeAppliances) {
    JsonObject appliances = doc.createNestedObject("appliances");
    for (int i = 0; i < 4; i++) {
      appliances[APPLIANCE_NAMES[i]] = applianceState[i];
    }
  }
  doc["fireStatus"] = fireStatus;
  doc["gasStatus"] = gasStatus;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.println("device/update -> " + String(code));
  http.end();
}

// GET /api/appliances — picks up commands issued from the React dashboard
void pollDashboardCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(BACKEND_HOST) + "/api/appliances");
  http.addHeader("x-device-key", DEVICE_KEY); // backend can also allow device-key on this GET
  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);

    for (JsonObject item : doc.as<JsonArray>()) {
      const char* name = item["name"];
      bool status = item["status"];
      for (int i = 0; i < 4; i++) {
        if (strcmp(APPLIANCE_NAMES[i], name) == 0 && applianceState[i] != status) {
          applianceState[i] = status;
          applyRelay(i);
        }
      }
    }
  }
  http.end();
}

void checkPhysicalSwitches() {
  bool changed = false;
  for (int i = 0; i < 4; i++) {
    bool pressed = digitalRead(SWITCH_PINS[i]) == HIGH;
    if (pressed && !lastSwitchState[i]) {
      applianceState[i] = !applianceState[i];
      applyRelay(i);
      changed = true;
    }
    lastSwitchState[i] = pressed;
  }
  if (changed) {
    sendDeviceUpdate(true);
  }
}

void checkSensors() {
  bool newFire = digitalRead(FLAME_PIN) == HIGH;
  int gasReading = analogRead(GAS_PIN);
  bool newGas = gasReading > GAS_THRESHOLD;

  bool changed = (newFire != fireStatus) || (newGas != gasStatus);
  fireStatus = newFire;
  gasStatus = newGas;

  bool alarm = fireStatus || gasStatus;
  digitalWrite(BUZZER_PIN, alarm ? HIGH : LOW);
  digitalWrite(LED_PIN, alarm ? HIGH : LOW);

  if (changed) {
    sendDeviceUpdate(false);
  }
}

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 4; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    pinMode(SWITCH_PINS[i], INPUT);
    digitalWrite(RELAY_PINS[i], LOW);
  }

  pinMode(FLAME_PIN, INPUT);
  pinMode(GAS_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  connectWifi();
  sendDeviceUpdate(true); // initial state on boot
}

void loop() {
  checkPhysicalSwitches();
  checkSensors();

  unsigned long now = millis();

  if (now - lastPoll > POLL_INTERVAL_MS) {
    pollDashboardCommands();
    lastPoll = now;
  }

  if (now - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
    sendDeviceUpdate(true);
    lastHeartbeat = now;
  }

  delay(50);
}
