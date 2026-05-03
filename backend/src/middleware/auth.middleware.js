const jwt = require("jsonwebtoken");

// Middleware: verifies the Bearer JWT in the Authorization header.
// Attaches the decoded payload (id, role) to req.user for downstream handlers.
module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
