const express = require("express");
const router = express.Router();

const contributionController = require("../controllers/contributionController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const auditMiddleware = require("../middleware/auditMiddleware");

const FINANCE_VIEW = ["treasurer", "chairperson", "secretary"];
const FINANCE_MANAGE = ["treasurer"];

router.get("/me", authMiddleware.verifyToken, contributionController.getMyContributions);
router.get("/member/:id/summary", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_VIEW), contributionController.getMemberContributionSummary);
router.get("/member/:id", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_VIEW), contributionController.getMemberContributions);
router.get("/", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_VIEW), contributionController.getContributions);
router.post("/", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_MANAGE), auditMiddleware.logAction("Recorded contribution"), contributionController.createContribution);

module.exports = router;
