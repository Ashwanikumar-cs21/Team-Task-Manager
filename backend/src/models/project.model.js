const mongoose = require("mongoose");

// Project schema — members is an array of User references.
// The first member is always the creator (set in the controller).
const schema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    members:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", schema);
