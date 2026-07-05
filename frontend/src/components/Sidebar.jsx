import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "▤" },
  { to: "/activity", label: "Activity", icon: "≡" },
  { to: "/about", label: "About", icon: "ℹ️" },
];

export default function Sidebar({ open, onClose }) {
  const content = (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-graphite px-4 py-6">
      <div className="mb-8 flex items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-display text-lg font-semibold text-white">Smart Home Security</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <span className="w-4 text-center font-mono">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex">{content}</div>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose}>
          <div className="h-full" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
