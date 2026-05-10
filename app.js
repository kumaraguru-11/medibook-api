const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./modules/auth/auth.route");
const userRoutes = require("./modules/users/user.route");
const doctorRoutes = require("./modules/doctor/doctor.route");
const patientRoutes = require("./modules/patient/patient.route");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/patient", patientRoutes);

app.use(errorHandler);

module.exports = app;
