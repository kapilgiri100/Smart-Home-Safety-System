const VARIANTS = {
  on: "bg-signal-green/10 text-signal-green",
  off: "bg-slate-100 text-muted",
  alert: "bg-signal-red/10 text-signal-red",
  safe: "bg-signal-green/10 text-signal-green",
  connected: "bg-signal-blue/10 text-signal-blue",
  disconnected: "bg-signal-amber/10 text-signal-amber",
};

export default function StatusBadge({ variant = "off", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono font-medium uppercase tracking-wide ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
