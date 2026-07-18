const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settingsController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const auditMiddleware = require("../middleware/auditMiddleware");

router.get("/", authMiddleware.verifyToken, settingsController.getSettings);
router.put("/", authMiddleware.verifyToken, adminMiddleware.isAdmin, auditMiddleware.logAction("Updated chama settings"), settingsController.updateSettings);

module.exports = router;
