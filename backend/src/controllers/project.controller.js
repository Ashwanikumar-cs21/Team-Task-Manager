const Project = require("../models/project.model");
const User = require("../models/user.model");
const Activity = require("../models/activity.model");
const Joi = require("joi");

// Validation schema for project creation
const projectSchema = Joi.object({
  name:        Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow("").optional(),
});

// POST /api/projects
// Creates a project; the creator is automatically added as the first member
exports.createProject = async (req, res, next) => {
  try {
    const { error } = projectSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const project = await Project.create({
      name:        req.body.name,
      description: req.body.description,
      createdBy:   req.user.id,
      members:     [req.user.id], // creator is always a member
    });

    await Activity.create({ project: project._id, user: req.user.id, action: "created the project" });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects
// Returns all projects the current user is a member of
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ members: req.user.id })
      .populate("members",   "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
// Returns a single project; only accessible to members
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("members",   "name email")
      .populate("createdBy", "name email");

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Verify the requester is a member before returning data
    const isMember = project.members.some((m) => String(m._id) === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Access denied" });

    res.json(project);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/members
// Adds a user (looked up by email) to the project; admin only
exports.addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only the project creator (admin) can add members
    if (String(project.createdBy) !== req.user.id)
      return res.status(403).json({ message: "Only admin can add members" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user found with that email" });

    // Prevent adding someone who is already a member
    if (project.members.map(String).includes(String(user._id)))
      return res.status(400).json({ message: "Already a member" });

    project.members.push(user._id);
    await project.save();

    await Activity.create({
      project: project._id,
      user:    req.user.id,
      action:  `added ${user.name} as a member`,
    });

    // Return the updated project with populated fields
    await project.populate("members",   "name email");
    await project.populate("createdBy", "name email");
    res.json(project);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id/members/:userId
// Removes a member from the project; admin only, cannot remove themselves
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.createdBy) !== req.user.id)
      return res.status(403).json({ message: "Only admin can remove members" });

    // Prevent the admin from removing themselves
    if (String(project.createdBy) === req.params.userId)
      return res.status(400).json({ message: "Cannot remove the project admin" });

    const removedUser = await User.findById(req.params.userId);
    project.members = project.members.filter((m) => String(m) !== req.params.userId);
    await project.save();

    if (removedUser)
      await Activity.create({
        project: project._id,
        user:    req.user.id,
        action:  `removed ${removedUser.name} from the project`,
      });

    await project.populate("members",   "name email");
    await project.populate("createdBy", "name email");
    res.json(project);
  } catch (err) {
    next(err);
  }
};
