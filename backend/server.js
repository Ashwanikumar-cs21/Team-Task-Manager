require("dotenv").config(); // Load environment variables from .env
const app = require("./src/app");
const connectDB = require("./src/config/db");

// Connect to MongoDB before starting the HTTP server
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
