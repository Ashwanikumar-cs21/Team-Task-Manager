const Task = require("../models/task.model");
const Project = require("../models/project.model");
const Activity = require("../models/activity.model");
const Joi = require("joi");

// Validation schema for task creation
const taskSchema = Joi.object({
  title:       Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).allow("").optional(),
  dueDate:     Joi.date().optional().allow(null, ""),
  priority:    Joi.string().valid("low", "medium", "high").default("medium"),
  assignedTo:  Joi.string().allow("", null).optional(),
  project:     Joi.string().required(),
});

// POST /api/tasks
// Creates a task inside a project; admin only
exports.createTask = async (req, res, next) => {
  try {
    const { error } = taskSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const project = await Project.findById(req.body.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only admin can create tasks
    const isAdmin = project.members.some((m) => String(m.user) === req.user.id && m.role === "admin");
    if (!isAdmin)
      return res.status(403).json({ message: "Only admin can create tasks" });

    // Remove empty assignedTo so Mongoose doesn't store an empty string
    const taskData = { ...req.body };
    if (!taskData.assignedTo) delete taskData.assignedTo;

    const task = await Task.create(taskData);
    await task.populate("assignedTo", "name email");

    await Activity.create({
      project: project._id,
      user:    req.user.id,
      action:  `created task "${task.title}"`,
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:projectId
// Returns all tasks for a project; accessible to all project members
exports.getTasks = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isMember = project.members.some((m) => String(m.user) === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
// Updates a task; admin can update any field, assignee can only update status
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    const isAdmin    = project.members.some((m) => String(m.user) === req.user.id && m.role === "admin");
    const isAssigned = task.assignedTo && String(task.assignedTo._id || task.assignedTo) === req.user.id;

    if (!isAdmin && !isAssigned)
      return res.status(403).json({ message: "Not authorized to update this task" });

    // Restrict non-admin users to status changes only
    const updates = isAdmin ? req.body : { status: req.body.status };

    const updated = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("assignedTo", "name email");

    await Activity.create({
      project: task.project,
      user:    req.user.id,
      action:  `updated task "${updated.title}"`,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
// Deletes a task; admin only
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    const isAdmin = project.members.some((m) => String(m.user) === req.user.id && m.role === "admin");
    if (!isAdmin)
      return res.status(403).json({ message: "Only admin can delete tasks" });

    await Task.findByIdAndDelete(req.params.id);

    await Activity.create({
      project: task.project,
      user:    req.user.id,
      action:  `deleted task "${task.title}"`,
    });

    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/dashboard
// Aggregates task stats across all projects the current user belongs to
exports.getDashboard = async (req, res, next) => {
  try {
    // Find all projects the user is a member of
    const projects   = await Project.find({ "members.user": req.user.id });
    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({ project: { $in: projectIds } }).populate("assignedTo", "name");
    const now   = new Date();

    // Build a map of { memberName: taskCount } for assigned tasks
    const byUser = {};
    tasks.forEach((t) => {
      if (t.assignedTo) {
        const name = t.assignedTo.name;
        byUser[name] = (byUser[name] || 0) + 1;
      }
    });

    res.json({
      total:       tasks.length,
      todo:        tasks.filter((t) => t.status === "todo").length,
      inprogress:  tasks.filter((t) => t.status === "inprogress").length,
      done:        tasks.filter((t) => t.status === "done").length,
      // Overdue = has a due date, that date is past, and task is not done
      overdue:     tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done").length,
      byUser,
      recentTasks: tasks.slice(-5).reverse(), // last 5 created tasks
    });
  } catch (err) {
    next(err);
  }
};
