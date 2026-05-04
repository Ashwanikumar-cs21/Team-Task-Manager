const express = require("express");
const cors = require("cors");

const app = express();

// Allow localhost in dev + any Vercel deployment URL + custom CLIENT_URL
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow Postman / server-to-server (no origin)
    if (!origin) return callback(null, true);
    // Allow any vercel.app preview/production URL
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "API running" });
});

app.use("/api/auth",     require("./routes/auth.routes"));
app.use("/api/projects", require("./routes/project.routes"));
app.use("/api/tasks",    require("./routes/task.routes"));
app.use("/api/activity", require("./routes/activity.routes"));

app.use(require("./middleware/error.middleware"));

module.exports = app;