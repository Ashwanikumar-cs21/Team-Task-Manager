const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getActivity } = require("../controllers/activity.controller");

router.use(auth);
router.get("/:projectId", getActivity);

module.exports = router;
