const express = require("express");

const router = express.Router();

const memberController = require("../controllers/memberController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const auditMiddleware = require("../middleware/auditMiddleware");

router.get(
    "/",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    memberController.getMembers
);

router.get(
    "/:id",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    memberController.getMemberById
);

router.post(
    "/",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    auditMiddleware.logAction("Created member"),
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