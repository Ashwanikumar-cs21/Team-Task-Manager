// Centralised error handler — catches any error passed via next(err).
// Must be registered after all routes in app.js.
module.exports = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
};
