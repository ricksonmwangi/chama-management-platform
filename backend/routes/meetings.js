const express = require("express");
const router = express.Router();

const meetingController = require("../controllers/meetingController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const auditMiddleware = require("../middleware/auditMiddleware");

const MEETING_MANAGE = ["secretary", "chairperson"];

router.get("/", authMiddleware.verifyToken, meetingController.getMeetings);
router.get("/:id", authMiddleware.verifyToken, meetingController.getMeetingById);
router.post("/", authMiddleware.verifyToken, roleMiddleware.allowRoles(...MEETING_MANAGE), auditMiddleware.logAction("Created meeting"), meetingController.createMeeting);
router.put("/:id", authMiddleware.verifyToken, roleMiddleware.allowRoles(...MEETING_MANAGE), auditMiddleware.logAction("Updated meeting"), meetingController.updateMeeting);
router.delete("/:id", authMiddleware.verifyToken, roleMiddleware.allowRoles(...MEETING_MANAGE), auditMiddleware.logAction("Deleted meeting"), meetingController.deleteMeeting);

router.put("/:id/rsvp", authMiddleware.verifyToken, meetingController.setMyRsvp);
router.get("/:id/attendance", authMiddleware.verifyToken, roleMiddleware.allowRoles(...MEETING_MANAGE), meetingController.getMeetingAttendance);
router.put("/:id/attendance", authMiddleware.verifyToken, roleMiddleware.allowRoles(...MEETING_MANAGE), auditMiddleware.logAction("Marked meeting attendance"), meetingController.markAttendance);

module.exports = router;
