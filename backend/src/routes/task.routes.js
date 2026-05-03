
const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { createTask, getTasks, updateTask, deleteTask, getDashboard } = require("../controllers/task.controller");

router.use(auth);

router.get("/dashboard", getDashboard);
router.post("/", createTask);
router.get("/:projectId", getTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
