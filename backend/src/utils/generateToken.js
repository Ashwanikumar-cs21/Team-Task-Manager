const jwt = require("jsonwebtoken");

// Signs a JWT containing the user's id and role.
// Token expires in 7 days; secret is read from environment variables.
module.exports = function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
