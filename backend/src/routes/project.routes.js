
const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { createProject, getProjects, getProject, addMember, removeMember } = require("../controllers/project.controller");

router.use(auth);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);

module.exports = router;
