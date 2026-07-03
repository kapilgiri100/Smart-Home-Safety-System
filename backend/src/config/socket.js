const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST", "PUT"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet.");
  }
  return io;
}

module.exports = { initSocket, getIO };
