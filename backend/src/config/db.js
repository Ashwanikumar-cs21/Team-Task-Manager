const mongoose = require("mongoose");

// Connect to MongoDB using the URI from environment variables.
// Exits the process on failure so the app doesn't run without a database.
module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
