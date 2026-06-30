const express = require("express");

const router = express.Router();

const mpesaController =
require("../controllers/mpesaController");

router.get(
    "/token",
    mpesaController.getAccessToken
);

router.post(
    "/callback",
    mpesaController.callback
);

router.post(
    "/stkpush",
    mpesaController.stkPush
);

module.exports = router;