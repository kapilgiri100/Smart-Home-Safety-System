import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// autoConnect is false so we only open the socket once the user is logged in
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
});
