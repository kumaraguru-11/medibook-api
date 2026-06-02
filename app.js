const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./modules/auth/auth.route");
const userRoutes = require("./modules/users/user.route");
const doctorRoutes = require("./modules/doctor/doctor.route");
const patientRoutes = require("./modules/patient/patient.route");
const appointmentRoutes = require("./modules/appointment/appointment.route");
const notificationRoutes = require("./modules/notification/notification.route");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

module.exports = app;
