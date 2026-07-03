const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const activityRoutes = require("./routes/activityRoutes");
const esp32Routes = require("./routes/esp32Routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/appliances", deviceRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/device", esp32Routes);

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use(errorHandler);

module.exports = app;
