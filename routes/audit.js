const express = require("express");

const router = express.Router();

const auditController =
require("../controllers/auditController");

const authMiddleware =
require("../middleware/authMiddleware");

const adminMiddleware =
require("../middleware/adminMiddleware");

router.get(
    "/",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    auditController.getAuditLogs
);

module.exports = router;