const express = require("express");
const cors = require("cors");

const app = express();

// Allow requests from the frontend origin (configurable via CLIENT_URL env var)
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));

// Parse incoming JSON request bodies
app.use(express.json());

// Health-check endpoint
app.get("/", (req, res) => res.json({ status: "API running" }));

// Route modules
app.use("/api/auth",     require("./routes/auth.routes"));
app.use("/api/projects", require("./routes/project.routes"));
app.use("/api/tasks",    require("./routes/task.routes"));
app.use("/api/activity", require("./routes/activity.routes"));

// Centralised error handler — must be registered last
app.use(require("./middleware/error.middleware"));

module.exports = app;
