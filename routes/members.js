const express = require("express");

const router = express.Router();

const memberController = require("../controllers/memberController");

const authMiddleware =
require("../middleware/authMiddleware");

const adminMiddleware =
require("../middleware/adminMiddleware");

const auditMiddleware =
require("../middleware/auditMiddleware");

router.get("/", memberController.getMembers);
router.get("/:id", memberController.getMemberById);
router.post(
    "/",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    memberController.createMember
);
router.put(
    "/:id",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    auditMiddleware.logAction("Updated member"),
    memberController.updateMember
);

router.delete(
    "/:id",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    auditMiddleware.logAction("Deleted member"),
    memberController.deleteMember
);

module.exports = router;