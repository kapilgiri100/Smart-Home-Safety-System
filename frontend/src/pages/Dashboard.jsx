import { useEffect, useRef, useState } from "react";

import SensorCard from "../components/SensorCard.jsx";
import { fetchAppliances, setApplianceStatus, setApplianceName } from "../services/deviceService.js";
import { fetchSensorStatus } from "../services/sensorService.js";
import { fetchSchedules, createSchedule, deleteSchedule, updateSchedule } from "../services/scheduleService.js";
import { socket } from "../socket/socket.js";


function getPumpAction(waterLevel, manualOverride = false, fireStatus = false, gasStatus = false) {
  if (manualOverride) {
    return "MANUAL";
  }
  if (fireStatus || gasStatus) {
    return "EMERGENCY";
  }
  if (waterLevel <= 20) {
    return "ON";
  }
  if (waterLevel >= 100) {
    return "OFF";
  }
  return "IDLE";
}

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
  const alarmAudioRef = useRef(null);

  const [schedules, setSchedules] = useState([]);
  const [schedulingEnabled, setSchedulingEnabled] = useState(true);

  const [scheduleTime, setScheduleTime] = useState("07:00");
  const [scheduleAction, setScheduleAction] = useState("ON");
  const [selectedApplianceIds, setSelectedApplianceIds] = useState([]);

  const [scheduleBusyId, setScheduleBusyId] = useState(null);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const [showScheduleUI, setShowScheduleUI] = useState(false);



  useEffect(() => {
    async function loadInitialState() {
      try {
        const [applianceResult, sensorResult, scheduleResult] = await Promise.allSettled([
          fetchAppliances(),
          fetchSensorStatus(),
          fetchSchedules(),
        ]);

        const applianceData = applianceResult.status === "fulfilled" && Array.isArray(applianceResult.value)
          ? applianceResult.value
          : fallbackAppliances;
        const sensorData = sensorResult.status === "fulfilled" ? sensorResult.value : null;

        const scheduleData =
          scheduleResult.status === "fulfilled" && Array.isArray(scheduleResult.value)
            ? scheduleResult.value
            : [];

        setAppliances(applianceData);
        setDraftNames(Object.fromEntries(applianceData.map((app) => [app.id, app.name])));
        setSensor(sensorData || defaultSensorState);
        setSchedules(scheduleData);
      } catch (err) {
        console.error(err);
        setAppliances(fallbackAppliances);
        setDraftNames(Object.fromEntries(fallbackAppliances.map((app) => [app.id, app.name])));
        setSensor(defaultSensorState);
        setSchedules([]);
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
  const pumpAction = getPumpAction(sensor.waterLevel, pumpOverride, sensor.fireStatus, sensor.gasStatus);

  useEffect(() => {
    if (!alertActive) {
      return;
    }

    const audio = alarmAudioRef.current;
    if (audio) {
      const alertSound = sensor.gasStatus ? "/gas_alert.mp3" : "/fire_aleart.mp3";
      audio.pause();
      audio.src = alertSound;
      audio.load();
      audio.currentTime = 0;
      audio.play().catch(() => { });
    }
  }, [alertActive, sensor.fireStatus, sensor.gasStatus]);

  async function refreshSchedules() {
    setSchedulesLoading(true);
    try {
      const next = await fetchSchedules();
      setSchedules(Array.isArray(next) ? next : []);
    } catch (err) {
      console.error(err);
    } finally {
      setSchedulesLoading(false);
    }
  }

  async function handleCreateSchedule(e) {
    e.preventDefault();
    if (!selectedApplianceIds.length) return;

    try {
      setScheduleBusyId("create");
      const created = await createSchedule({
        enabled: true,
        timeHHmm: scheduleTime,
        action: scheduleAction,
        applianceIds: selectedApplianceIds,
      });

      // reset form
      setSelectedApplianceIds([]);

      // Ensure the UI updates even if server payload/join has issues.
      // Prefer server response, but fall back to re-fetch.
      if (created && (Array.isArray(created) ? created.length : created.id)) {
        // created is expected to be the full schedule object; just re-fetch to match existing state shape.
      }

      await refreshSchedules();
    } catch (err) {
      console.error("Create schedule failed:", err?.response?.data || err);
      await refreshSchedules();
    } finally {
      setScheduleBusyId(null);
    }
  }


  async function handleSetScheduleEnabled(schedule, enabled) {
    try {
      setScheduleBusyId(schedule.id);
      const updated = await updateSchedule(schedule.id, { enabled });
      setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      console.error(err);
    } finally {
      setScheduleBusyId(null);
    }
  }

  async function handleDeleteSchedule(schedule) {
    try {
      setScheduleBusyId(schedule.id);
      await deleteSchedule(schedule.id);
      setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
    } catch (err) {
      console.error(err);
    } finally {
      setScheduleBusyId(null);
    }
  }

  function toggleApplianceSelection(id) {
    setSelectedApplianceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <audio ref={alarmAudioRef} preload="auto" className="hidden" />
      {alertActive && (
        <div className="rounded-2xl bg-signal-red px-5 py-3 text-sm font-semibold text-white">
          ⚠ Safety alert active — fire or gas detected. The pump is now set to emergency mode.
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Schedule</h2>

          <button
            type="button"
            onClick={() => {
              setShowScheduleUI((v) => !v);
              if (!showScheduleUI) refreshSchedules();
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            {showScheduleUI ? "Hide" : "Add / Manage"}
          </button>
        </div>

        {showScheduleUI && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Scheduling Enabled</p>
                  <p className="mt-1 text-xs text-muted">When OFF, schedules won’t change appliance states (but you can still add/edit schedules).</p>
                </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const next = !schedulingEnabled;
                      try {
                        // Optimistic UI
                        setSchedules((prev) => prev.map((s) => ({ ...s, enabled: next })));
                        setSchedulingEnabled(next);

                        // Always re-fetch IDs server-side to avoid any client state staleness.
                        const latest = await fetchSchedules();
                        const ids = Array.isArray(latest) ? latest.map((s) => s.id) : [];
                        await Promise.all(ids.map((id) => updateSchedule(id, { enabled: next })));


                        await refreshSchedules();
                      } catch (err) {
                        console.error(err);
                        await refreshSchedules();
                        setSchedulingEnabled((v) => !v);
                      }
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                    schedulingEnabled ? "bg-signal-green" : "bg-slate-900"
                  }`}
                  >
                    {schedulingEnabled ? "Enabled" : "Disabled"}
                  </button>

              </div>

              <form onSubmit={handleCreateSchedule} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-muted">Time (HH:MM)</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-signal-blue focus:ring-2 focus:ring-signal-blue/20"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-muted">Action</label>
                  <select
                    value={scheduleAction}
                    onChange={(e) => setScheduleAction(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-signal-blue focus:ring-2 focus:ring-signal-blue/20"
                  >
                    <option value="ON">Turn ON</option>
                    <option value="OFF">Turn OFF</option>
                  </select>
                </div>

                <div className="md:col-span-6">
                  <label className="mb-2 block text-xs font-semibold text-muted">Appliances</label>
                  <div className="grid grid-cols-2 gap-2">
                    {appliances.map((app) => {
                      const checked = selectedApplianceIds.includes(app.id);
                      return (
                        <label
                          key={app.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                            checked
                              ? "border-signal-blue bg-signal-blue/10 text-ink"
                              : "border-slate-200 bg-white text-muted hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleApplianceSelection(app.id)}
                            className="accent-signal-blue"
                          />
                          <span className="truncate">{app.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-12 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={scheduleBusyId === "create" || !selectedApplianceIds.length}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {scheduleBusyId === "create" ? "Saving..." : "Add Schedule"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Schedule List</p>
                <button
                  type="button"
                  disabled={schedulesLoading}
                  onClick={refreshSchedules}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-muted transition hover:border-slate-300"
                >
                  {schedulesLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="space-y-3">
                {schedules.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-muted">
                    No schedules yet.
                  </div>
                ) : (
                  schedules.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {s.timeHHmm} · {s.action === "ON" ? "Turn ON" : "Turn OFF"}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Appliances: {Array.isArray(s.appliances) && s.appliances.length ? s.appliances.map((a) => a.name).join(", ") : "—"}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 md:items-end">
                          <button
                            type="button"
                            disabled={scheduleBusyId === s.id}
                            onClick={() => handleSetScheduleEnabled(s, !s.enabled)}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
                              s.enabled ? "bg-signal-green" : "bg-slate-900"
                            } disabled:opacity-50`}
                          >
                            {s.enabled ? "Enabled" : "Disabled"}
                          </button>
                          <button
                            type="button"
                            disabled={scheduleBusyId === s.id}
                            onClick={() => handleDeleteSchedule(s)}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-muted transition hover:border-slate-300 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </section>


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
