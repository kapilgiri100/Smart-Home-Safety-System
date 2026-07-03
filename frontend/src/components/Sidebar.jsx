import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "▤" },
  { to: "/activity", label: "Activity", icon: "≡" },
  { to: "/about", label: "About", icon: "ℹ️" },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col bg-graphite px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="text-xl">🛡️</span>
        <span className="font-display text-lg font-semibold text-white">Guardian</span>
      </div>

      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
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
}
