const express = require("express");
const cors = require("cors");

const app = express();

/**
 * ✅ Allowed origins (local + production)
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://team-task-manager-1a8l-6ei2s2p8z-ashwanikumar-cs21s-projects.vercel.app"
];

/**
 * ✅ CORS configuration
 */
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

/**
 * ✅ Middleware
 */
app.use(express.json());

/**
 * ✅ Health check
 */
app.get("/", (req, res) => {
  res.json({ status: "API running" });
});

/**
 * ✅ Routes
 */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/projects", require("./routes/project.routes"));
app.use("/api/tasks", require("./routes/task.routes"));
app.use("/api/activity", require("./routes/activity.routes"));

/**
 * ✅ Error handler (must be last)
 */
app.use(require("./middleware/error.middleware"));

module.exports = app;