import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      // error is already surfaced via context
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-panel">
        <div className="mb-6 text-center">
        
          <h1 className="mt-2 font-display text-xl font-semibold text-ink">Smart home safety</h1>
          <p className="mt-1 text-sm text-muted">Smart home safety console</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-signal-blue focus:outline-none focus:ring-1 focus:ring-signal-blue"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-signal-blue focus:outline-none focus:ring-1 focus:ring-signal-blue"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-signal-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-signal-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Log in"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Create an account
          </button>
        </form>
      </div>
    </div>
  );
}
