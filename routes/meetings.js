const express = require("express");

const router = express.Router();

const meetingController =
require("../controllers/meetingController");

const authMiddleware =
require("../middleware/authMiddleware");

const adminMiddleware =
require("../middleware/adminMiddleware");

const auditMiddleware =
require("../middleware/auditMiddleware");


router.post(
    "/",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    auditMiddleware.logAction(
        "Created meeting"
    ),
    meetingController.createMeeting
);

router.get(
    "/",
    authMiddleware.verifyToken,
    meetingController.getMeetings
);

router.get(
    "/:id",
    authMiddleware.verifyToken,
    meetingController.getMeetingById
);

router.put(
    "/:id",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    auditMiddleware.logAction("Updated meeting"),
    meetingController.updateMeeting
);

router.delete(
    "/:id",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    auditMiddleware.logAction("Deleted meeting"),
    meetingController.deleteMeeting
);
module.exports = router;