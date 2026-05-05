const Project = require("../models/project.model");
const User = require("../models/user.model");
const Activity = require("../models/activity.model");
const Joi = require("joi");

const projectSchema = Joi.object({
  name:        Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow("").optional(),
});

const populate = (q) =>
  q.populate("members.user", "name email").populate("createdBy", "name email");

// Works for both old flat ObjectId members and new {user, role} subdocuments
const getMemberId = (m) => String(m.user?._id || m.user || m._id || m);
const getMemberRole = (m) => m.role || "admin"; // old flat members default to admin (they were creators)

const isAdmin = (project, userId) =>
  project.members.some((m) => getMemberId(m) === userId && getMemberRole(m) === "admin");

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const { error } = projectSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const project = await Project.create({
      name:        req.body.name,
      description: req.body.description,
      createdBy:   req.user.id,
      members:     [{ user: req.user.id, role: "admin" }],
    });

    await Activity.create({ project: project._id, user: req.user.id, action: "created the project" });
    res.status(201).json(project);
  } catch (err) { next(err); }
};

// GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await populate(
      Project.find({ "members.user": req.user.id })
    ).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { next(err); }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await populate(Project.findById(req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isMember = project.members.some((m) => getMemberId(m) === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Access denied" });

    res.json(project);
  } catch (err) { next(err); }
};

// POST /api/projects/:id/members
exports.addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isAdmin(project, req.user.id))
      return res.status(403).json({ message: "Only admin can add members" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user found with that email" });
    if (project.members.some((m) => String(m.user) === String(user._id)))
      return res.status(400).json({ message: "Already a member" });

    project.members.push({ user: user._id, role: "member" });
    await project.save();

    await Activity.create({ project: project._id, user: req.user.id, action: `added ${user.name} as a member` });
    res.json(await populate(Project.findById(project._id)));
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isAdmin(project, req.user.id))
      return res.status(403).json({ message: "Only admin can remove members" });
    if (String(project.createdBy) === req.params.userId)
      return res.status(400).json({ message: "Cannot remove the project creator" });

    const removedUser = await User.findById(req.params.userId);
    project.members = project.members.filter((m) => String(m.user) !== req.params.userId);
    await project.save();

    if (removedUser)
      await Activity.create({ project: project._id, user: req.user.id, action: `removed ${removedUser.name} from the project` });

    res.json(await populate(Project.findById(project._id)));
  } catch (err) { next(err); }
};

// PUT /api/projects/:id/members/:userId/role
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["admin", "member"].includes(role))
      return res.status(400).json({ message: "Role must be admin or member" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isAdmin(project, req.user.id))
      return res.status(403).json({ message: "Only admin can change roles" });
    if (String(project.createdBy) === req.params.userId && role === "member")
      return res.status(400).json({ message: "Cannot demote the project creator" });

    const entry = project.members.find((m) => String(m.user) === req.params.userId);
    if (!entry) return res.status(404).json({ message: "Member not found" });

    entry.role = role;
    await project.save();

    const target = await User.findById(req.params.userId);
    await Activity.create({ project: project._id, user: req.user.id, action: `changed ${target?.name}'s role to ${role}` });

    res.json(await populate(Project.findById(project._id)));
  } catch (err) { next(err); }
};
