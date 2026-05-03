// Role-based access middleware factory.
// Usage: router.get("/admin-only", auth, requireRole("admin"), handler)
// Note: project-level admin checks are done inline in controllers using createdBy,
// so this middleware is available for future global role enforcement.
module.exports = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
