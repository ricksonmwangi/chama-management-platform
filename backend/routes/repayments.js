const express = require("express");
const router = express.Router();

const repaymentController = require("../controllers/repaymentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const auditMiddleware = require("../middleware/auditMiddleware");

const FINANCE_VIEW = ["treasurer", "chairperson", "secretary"];
const FINANCE_MANAGE = ["treasurer"];

router.get("/", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_VIEW), repaymentController.getRepayments);
router.get("/loan/:id", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_VIEW), repaymentController.getLoanRepayments);
router.post("/", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_MANAGE), auditMiddleware.logAction("Recorded repayment"), repaymentController.recordRepayment);

module.exports = router;
