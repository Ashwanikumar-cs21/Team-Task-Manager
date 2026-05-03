const mongoose = require("mongoose");

// Activity log schema — records who did what inside a project.
// Used to populate the Activity tab on the project page.
const schema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    action:  { type: String, required: true }, // human-readable description e.g. 'created task "Fix bug"'
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", schema);
