const express = require("express");
const router = express.Router();

const mpesaController = require("../controllers/mpesaController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const FINANCE_MANAGE = ["treasurer"];

router.get("/token", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_MANAGE), mpesaController.getAccessToken);
router.get("/transactions", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_MANAGE), mpesaController.getTransactions);
router.post("/stkpush", authMiddleware.verifyToken, roleMiddleware.allowRoles(...FINANCE_MANAGE), mpesaController.stkPush);

// Self-service — any authenticated user can pay their OWN contribution.
// No role restriction: this only ever touches the caller's own linked
// member record, never anyone else's.
router.post("/pay-contribution", authMiddleware.verifyToken, mpesaController.payMyContribution);

// Safaricom calls this directly — it can't send a JWT, so it stays public.
router.post("/callback", mpesaController.callback);

module.exports = router;
