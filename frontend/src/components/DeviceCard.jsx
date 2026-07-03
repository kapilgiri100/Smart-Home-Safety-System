const ICONS = {
  Light: "💡",
  Fan: "🌀",
  TV: "📺",
  "Smart Socket": "🔌",
};

export default function DeviceCard({ appliance, onToggle, busy }) {
  const isOn = appliance.status;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-2xl">{ICONS[appliance.name] || "⚙️"}</span>
          <h3 className="mt-2 font-display text-base font-semibold text-ink">
            {appliance.name}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {isOn ? "ACTIVE" : "STANDBY"}
          </p>
        </div>

        <button
          role="switch"
          aria-checked={isOn}
          aria-label={`Toggle ${appliance.name}`}
          disabled={busy}
          onClick={() => onToggle(appliance)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:ring-offset-2 disabled:opacity-50 ${
            isOn ? "bg-signal-green" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              isOn ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
