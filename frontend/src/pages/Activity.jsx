import { useEffect, useState } from "react";
import ActivityTable from "../components/ActivityTable.jsx";
import { fetchActivity } from "../services/sensorService.js";
import { socket } from "../socket/socket.js";

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity(200)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Any appliance or sensor update also implies a new log row was written,
    // so re-fetch the list to keep this page live too.
    function refresh() {
      fetchActivity(200).then(setLogs);
    }
    socket.on("appliance:update", refresh);
    socket.on("sensor:update", refresh);
    return () => {
      socket.off("appliance:update", refresh);
      socket.off("sensor:update", refresh);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-lg font-semibold text-ink">Activity History</h1>
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-panel" />
      ) : (
        <ActivityTable logs={logs} />
      )}
    </div>
  );
}
