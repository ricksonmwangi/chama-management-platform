const express = require("express");

const router = express.Router();

const loanController =
require("../controllers/loanController");

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
    auditMiddleware.logAction("Created loan"),
    loanController.applyLoan
);

router.get(
    "/",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    loanController.getLoans
);

router.put(
    "/:id/approve",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    auditMiddleware.logAction("Approved loan"),
    loanController.approveLoan
);

router.put(
    "/:id/reject",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    auditMiddleware.logAction("Rejected loan"),
    loanController.rejectLoan
);

router.get(
    "/:id/balance",
    authMiddleware.verifyToken,
    loanController.getLoanBalance
);

module.exports = router;