import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ deviceConnected, lastHeartbeat }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Site logo" className="h-9 w-9 rounded-full object-cover" />
        <div>
          <p className="text-xs text-muted">Smart Home Safety Console</p>
        </div>
      </div>

      {/* Signature element: a live system-pulse strip showing the ESP32 link */}
      <div className="flex items-center gap-2 rounded-full bg-canvas px-3 py-1.5">
        <span
          className={`h-2 w-2 rounded-full ${deviceConnected ? "bg-signal-green pulse-dot" : "bg-signal-amber"
            }`}
        />
        <span className="font-mono text-xs text-muted">
          {deviceConnected ? "ESP32 LINKED" : "AWAITING DEVICE"}
          {lastHeartbeat && (
            <span className="ml-2 text-slate-400">
              · last ping {new Date(lastHeartbeat).toLocaleTimeString()}
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">
          {user?.name}
        </span>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
