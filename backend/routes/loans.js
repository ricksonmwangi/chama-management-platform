const express = require("express");
const router = express.Router();

const loanController = require("../controllers/loanController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const auditMiddleware = require("../middleware/auditMiddleware");

const FINANCE_VIEW = ["treasurer", "chairperson", "secretary"];
const FINANCE_MANAGE = ["treasurer"];

router.get("/me", authMiddleware.verifyToken, loanController.getMyLoans);
router.get("/:id/balance", authMiddleware.verifyToken, loanController.getLoanBalance);
router.get("/", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_VIEW), loanController.getLoans);
router.post("/", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_MANAGE), auditMiddleware.logAction("Applied for loan"), loanController.applyLoan);
router.put("/:id/approve", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_MANAGE), auditMiddleware.logAction("Approved loan"), loanController.approveLoan);
router.put("/:id/reject", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_MANAGE), auditMiddleware.logAction("Rejected loan"), loanController.rejectLoan);

module.exports = router;
