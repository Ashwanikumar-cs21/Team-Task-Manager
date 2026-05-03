const mongoose = require("mongoose");

// Task schema — belongs to a Project and optionally assigned to a User
const schema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate:     { type: Date },
    priority:    { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status:      { type: String, enum: ["todo", "inprogress", "done"], default: "todo" },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    project:     { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", schema);
