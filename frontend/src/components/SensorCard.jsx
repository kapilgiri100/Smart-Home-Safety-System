import StatusBadge from "./StatusBadge.jsx";

export default function SensorCard({ label, icon, triggered, description }) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-panel transition-colors ${
        triggered ? "bg-signal-red text-white" : "bg-white text-ink"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {triggered ? (
          <StatusBadge variant="alert" >
            <span className={triggered ? "text-white" : ""}>Alert</span>
          </StatusBadge>
        ) : (
          <StatusBadge variant="safe">Safe</StatusBadge>
        )}
      </div>
      <h3 className="mt-3 font-display text-base font-semibold">{label}</h3>
      <p className={`mt-1 text-xs ${triggered ? "text-white/80" : "text-muted"}`}>
        {triggered ? description.alert : description.safe}
      </p>
    </div>
  );
}
