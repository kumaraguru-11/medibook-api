const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./modules/auth/auth.route");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(errorHandler);

module.exports = app;
