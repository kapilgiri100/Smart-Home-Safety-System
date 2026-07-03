import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas text-center">
      <span className="text-4xl">🛰️</span>
      <h1 className="font-display text-xl font-semibold text-ink">Page not found</h1>
      <p className="text-sm text-muted">This route doesn't exist in the Guardian console.</p>
      <Link to="/dashboard" className="mt-2 text-sm font-medium text-signal-blue hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
