const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const generateToken = require("../utils/generateToken");

// Validation schemas — Joi validates request body before hitting the database
const signupSchema = Joi.object({
  name:     Joi.string().min(2).max(50).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role:     Joi.string().valid("admin", "member").default("member"),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST /api/auth/signup
// Creates a new user account with a hashed password
exports.signup = async (req, res, next) => {
  try {
    // Validate input shape and constraints
    const { error } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Prevent duplicate accounts
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    // Hash password with cost factor 12 before storing
    const hashed = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      name:     req.body.name,
      email:    req.body.email,
      password: hashed,
      role:     req.body.role || "member",
    });

    res.status(201).json({ user, token: generateToken(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
// Verifies credentials and returns a JWT
exports.login = async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Use a generic error message to avoid leaking whether the email exists
    const user = await User.findOne({ email: req.body.email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    res.json({ user, token: generateToken(user) });
  } catch (err) {
    next(err);
  }
};
