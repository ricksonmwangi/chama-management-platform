const express = require("express");

const router = express.Router();

const contributionController =
require("../controllers/contributionController");

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
    auditMiddleware.logAction("Recorded contribution"),
    contributionController.createContribution
);

router.get(
    "/",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    contributionController.getContributions
);

router.get(
    "/member/:id",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    contributionController.getMemberContributions
);

router.get(
    "/member/:id/summary",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
    contributionController.getMemberContributionSummary
);

module.exports = router;