const express = require("express");

const router = express.Router();

const repaymentController =
require("../controllers/repaymentController");

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
    auditMiddleware.logAction("Recorded repayment"),
    repaymentController.recordRepayment
);

module.exports = router;