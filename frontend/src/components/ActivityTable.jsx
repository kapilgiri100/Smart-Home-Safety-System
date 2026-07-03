function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ActivityTable({ logs }) {
  if (!logs.length) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-panel">
        No activity yet. Actions and alerts will appear here as they happen.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-panel">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-muted">
            <th className="px-5 py-3 font-medium">Event</th>
            <th className="px-5 py-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-slate-50 last:border-0">
              <td className="px-5 py-3 text-ink">{log.event}</td>
              <td className="px-5 py-3 font-mono text-xs text-muted">
                {formatTime(log.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
