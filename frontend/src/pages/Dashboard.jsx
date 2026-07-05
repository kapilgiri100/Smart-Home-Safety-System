import { useEffect, useState } from "react";

import SensorCard from "../components/SensorCard.jsx";
import { fetchAppliances, setApplianceStatus, setApplianceName } from "../services/deviceService.js";
import { fetchSensorStatus } from "../services/sensorService.js";
import { socket } from "../socket/socket.js";

const fallbackAppliances = [
  { id: 1, name: "Light", status: false },
  { id: 2, name: "Fan", status: false },
  { id: 3, name: "TV", status: false },
  { id: 4, name: "Smart Socket", status: false },
];

const defaultSensorState = { fireStatus: false, gasStatus: false, waterLevel: 0 };

export default function Dashboard() {
  const [appliances, setAppliances] = useState(fallbackAppliances);
  const [draftNames, setDraftNames] = useState({});
  const [sensor, setSensor] = useState(defaultSensorState);
  const [pumpOverride, setPumpOverride] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialState() {
      try {
        const [applianceResult, sensorResult] = await Promise.allSettled([
          fetchAppliances(),
          fetchSensorStatus(),
        ]);

        const applianceData = applianceResult.status === "fulfilled" && Array.isArray(applianceResult.value)
          ? applianceResult.value
          : fallbackAppliances;
        const sensorData = sensorResult.status === "fulfilled" ? sensorResult.value : null;

        setAppliances(applianceData);
        setDraftNames(Object.fromEntries(applianceData.map((app) => [app.id, app.name])));
        setSensor(sensorData || defaultSensorState);
      } catch (err) {
        console.error(err);
        setAppliances(fallbackAppliances);
        setDraftNames(Object.fromEntries(fallbackAppliances.map((app) => [app.id, app.name])));
        setSensor(defaultSensorState);
      } finally {
        setLoading(false);
      }
    }
    loadInitialState();
  }, []);

  useEffect(() => {
    function handleApplianceUpdate(updated) {
      setAppliances((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
    }
    function handleSensorUpdate(updated) {
      setSensor(updated);
    }

    socket.on("appliance:update", handleApplianceUpdate);
    socket.on("sensor:update", handleSensorUpdate);

    return () => {
      socket.off("appliance:update", handleApplianceUpdate);
      socket.off("sensor:update", handleSensorUpdate);
    };
  }, []);

  async function handleToggle(appliance) {
    setBusyId(appliance.id);
    try {
      const updated = await setApplianceStatus(appliance.id, !appliance.status);
      setAppliances((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setDraftNames((prev) => ({ ...prev, [updated.id]: updated.name }));
    } finally {
      setBusyId(null);
    }
  }

  function handleNameChange(applianceId, value) {
    setDraftNames((prev) => ({ ...prev, [applianceId]: value }));
  }

  async function handleNameSave(appliance) {
    const nextName = draftNames[appliance.id]?.trim();
    if (!nextName || nextName === appliance.name) {
      setDraftNames((prev) => ({ ...prev, [appliance.id]: appliance.name }));
      return;
    }

    setBusyId(appliance.id);
    try {
      const updated = await setApplianceName(appliance.id, nextName);
      setAppliances((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error(err);
      setDraftNames((prev) => ({ ...prev, [appliance.id]: appliance.name }));
    } finally {
      setBusyId(null);
    }
  }

  const alertActive = sensor.fireStatus || sensor.gasStatus;
  const pumpAction = sensor.waterLevel <= 20 ? "ON" : sensor.waterLevel >= 100 ? "OFF" : pumpOverride ? "MANUAL" : "IDLE";

  return (
    <div className="flex flex-col gap-6">
      {alertActive && (
        <div className="rounded-2xl bg-signal-red px-5 py-3 text-sm font-semibold text-white">
          ⚠ Safety alert active — check the fire and gas sensors below.
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted">
          Appliances
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-panel" />
            ))
            : appliances.slice(0, 4).map((appliance, idx) => (
              <div
                key={appliance.id}
                className={
                  "rounded-2xl border px-4 py-4 text-sm transition " +
                  (appliance.status
                    ? "border-signal-green bg-signal-green/10 text-signal-green"
                    : "border-slate-200 bg-white text-ink")
                }
              >
                <label className="sr-only" htmlFor={`appliance-name-${appliance.id}`}>
                  Appliance name
                </label>
                <input
                  id={`appliance-name-${appliance.id}`}
                  type="text"
                  value={draftNames[appliance.id] ?? appliance.name}
                  onChange={(e) => handleNameChange(appliance.id, e.target.value)}
                  onBlur={() => handleNameSave(appliance)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNameSave(appliance);
                      e.currentTarget.blur();
                    }
                    if (e.key === "Escape") {
                      setDraftNames((prev) => ({ ...prev, [appliance.id]: appliance.name }));
                      e.currentTarget.blur();
                    }
                  }}
                  className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:border-signal-blue focus:ring-2 focus:ring-signal-blue/20"
                />
                <button
                  type="button"
                  onClick={() => handleToggle(appliance)}
                  disabled={busyId === appliance.id}
                  className={`w-full rounded-2xl px-3 py-3 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:ring-offset-2 disabled:opacity-50 ${appliance.status ? "bg-signal-green text-white" : "bg-slate-900 text-white"
                    }`}
                >
                  {appliance.status ? "Turn OFF" : "Turn ON"}
                </button>
              </div>
            ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted">
          Sensors
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className={`rounded-2xl p-5 shadow-panel transition-colors ${sensor.waterLevel >= 70 ? "bg-signal-amber text-white" : "bg-white text-ink"}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">💧</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sensor.waterLevel >= 70 ? "bg-white/20 text-white" : "bg-slate-100 text-muted"}`}>
                {sensor.waterLevel >= 70 ? "High" : sensor.waterLevel >= 40 ? "Normal" : "Low"}
              </span>
            </div>
            <h3 className="mt-3 font-display text-base font-semibold">Water Level</h3>
            <p className={`mt-1 text-xs ${sensor.waterLevel >= 70 ? "text-white/80" : "text-muted"}`}>
              Current water level is {sensor.waterLevel}%.
            </p>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${sensor.waterLevel >= 70 ? "bg-white" : "bg-signal-blue"}`}
                style={{ width: `${Math.max(6, sensor.waterLevel)}%` }}
              />
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-muted">
              <p className="font-semibold text-ink">Pump status: {pumpAction}</p>
              {sensor.waterLevel <= 50 && (
                <button
                  type="button"
                  onClick={() => setPumpOverride((prev) => !prev)}
                  className="mt-2 rounded-lg bg-signal-blue px-3 py-2 font-semibold text-white"
                >
                  {pumpOverride ? "Disable manual override" : "Turn pump on manually"}
                </button>
              )}
            </div>
          </div>
          <SensorCard
            label="Flame Sensor"
            icon="🔥"
            triggered={sensor.fireStatus}
            description={{
              safe: "No flame detected.",
              alert: "Fire detected — buzzer and warning LED are active.",
            }}
          />
          <SensorCard
            label="MQ-2 Gas Sensor"
            icon="🫧"
            triggered={sensor.gasStatus}
            description={{
              safe: "Gas levels within normal range.",
              alert: "Gas leakage detected — buzzer and warning LED are active.",
            }}
          />
        </div>
      </section>

    </div>
  );
}
