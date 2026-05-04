const Activity = require("../models/activity.model");
const Project = require("../models/project.model");

// GET /api/activity/:projectId
// Returns the 20 most recent activity log entries for a project.
// Only accessible to project members.
exports.getActivity = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Verify the requester is a member of this project
    const isMember = project.members.some((m) => String(m.user?._id || m.user || m) === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Access denied" });

    const logs = await Activity.find({ project: req.params.projectId })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(20); // cap at 20 entries to keep the response lightweight

    res.json(logs);
  } catch (err) {
    next(err);
  }
};
