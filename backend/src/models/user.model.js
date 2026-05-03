const mongoose = require("mongoose");

// User schema — password field is excluded from JSON responses via toJSON()
const schema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // stored as bcrypt hash
    role:     { type: String, enum: ["admin", "member"], default: "member" },
  },
  { timestamps: true }
);

// Strip the password hash before sending the document over the wire
schema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", schema);
