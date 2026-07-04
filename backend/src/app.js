const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const activityRoutes = require("./routes/activityRoutes");
const esp32Routes = require("./routes/esp32Routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = [
    "https://smart-home-safety-system-cusj.onrender.com",
    "https://smart-home-safety-system.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...(process.env.CORS_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
                callback(null, true);
                return;
            }

            callback(null, false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
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
