const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware.verifyToken, authController.getMe);
router.get("/users", authMiddleware.verifyToken, adminMiddleware.isAdmin, authController.getAllUsers);
router.put("/link-member", authMiddleware.verifyToken, adminMiddleware.isAdmin, authController.linkMember);
router.put("/change-password", authMiddleware.verifyToken, authController.changePassword);

module.exports = router;