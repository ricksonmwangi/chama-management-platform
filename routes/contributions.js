const express = require("express");

const router = express.Router();

const contributionController =
require("../controllers/contributionController");

const authMiddleware =
require("../middleware/authMiddleware");

const adminMiddleware =
require("../middleware/adminMiddleware");

router.post(
    "/",
    authMiddleware.verifyToken,
    adminMiddleware.isAdmin,
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
    contributionController.getMemberContributions
);

router.get(
    "/member/:id/summary",
    authMiddleware.verifyToken,
    contributionController.getMemberContributionSummary
);

module.exports = router;