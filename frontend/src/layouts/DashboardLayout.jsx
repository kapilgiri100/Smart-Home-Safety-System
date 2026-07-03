import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import { socket } from "../socket/socket.js";

export default function DashboardLayout() {
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [deviceConnected, setDeviceConnected] = useState(false);

  useEffect(() => {
    function handleHeartbeat({ timestamp }) {
      setLastHeartbeat(timestamp);
      setDeviceConnected(true);
    }
    socket.on("device:heartbeat", handleHeartbeat);

    // If no heartbeat arrives for 60s, treat the ESP32 as offline
    const timer = setInterval(() => {
      if (lastHeartbeat && Date.now() - new Date(lastHeartbeat).getTime() > 60000) {
        setDeviceConnected(false);
      }
    }, 5000);

    return () => {
      socket.off("device:heartbeat", handleHeartbeat);
      clearInterval(timer);
    };
  }, [lastHeartbeat]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar deviceConnected={deviceConnected} lastHeartbeat={lastHeartbeat} />
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
