const axios = require("axios");
const db = require("../config/db");

/*
|--------------------------------------------------------------------------
| Get M-Pesa Access Token
|--------------------------------------------------------------------------
*/
exports.getAccessToken = async (req, res) => {

    try {

        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString("base64");

        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`
                },
                timeout: 30000
            }
        );

        return res.status(200).json(response.data);

    } catch (error) {

        console.error(
            "ACCESS TOKEN ERROR:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            message: "Failed to get access token."
        });

    }

};


/*
|--------------------------------------------------------------------------
| M-Pesa Callback
|--------------------------------------------------------------------------
*/
exports.callback = async (req, res) => {

    try {

        const callback = req.body.Body.stkCallback;

        // Payment failed
        if (callback.ResultCode !== 0) {

            console.log("Payment failed:", callback.ResultDesc);

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }

        const items = callback.CallbackMetadata.Item;

        let amount = null;
        let phone = null;
        let receipt = null;

        items.forEach(item => {

            if (item.Name === "Amount") {
                amount = item.Value;
            }

            if (item.Name === "PhoneNumber") {
                phone = item.Value;
            }

            if (item.Name === "MpesaReceiptNumber") {
                receipt = item.Value;
            }

        });

        // Prevent duplicate callbacks
        db.query(
            "SELECT id FROM mpesa_transactions WHERE checkout_request_id = ?",
            [callback.CheckoutRequestID],
            (err, results) => {

                if (err) {
                    console.error(err);
                    return;
                }

                if (results.length > 0) {
                    console.log("Duplicate callback ignored.");
                    return;
                }

                db.query(
                    `INSERT INTO mpesa_transactions
                    (
                        phone,
                        amount,
                        receipt_number,
                        checkout_request_id
                    )
                    VALUES (?, ?, ?, ?)`,
                    [
                        phone,
                        amount,
                        receipt,
                        callback.CheckoutRequestID
                    ],
                    (err) => {

                        if (err) {
                            console.error(err);
                        } else {
                            console.log("Transaction saved successfully.");
                        }

                    }
                );

            }
        );

        return res.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });

    } catch (error) {

        console.error("CALLBACK ERROR:", error);

        return res.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });

    }

};


/*
|--------------------------------------------------------------------------
| Initiate STK Push
|--------------------------------------------------------------------------
*/
exports.stkPush = async (req, res) => {

    try {

        const { phone, amount } = req.body;

        // Validation
        if (!phone || amount === undefined) {

            return res.status(400).json({
                message: "Phone number and amount are required."
            });

        }

        const paymentAmount = Number(amount);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {

            return res.status(400).json({
                message: "Amount must be greater than zero."
            });

        }

        const phoneRegex = /^2547\d{8}$/;

        if (!phoneRegex.test(phone)) {

            return res.status(400).json({
                message: "Phone number must be in the format 2547XXXXXXXX."
            });

        }

        // Generate OAuth Access Token
        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString("base64");

        const tokenResponse = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`
                },
                timeout: 30000
            }
        );

        const accessToken = tokenResponse.data.access_token;

        if (!accessToken) {

            return res.status(500).json({
                message: "Failed to retrieve access token."
            });

        }

        // Generate Timestamp
        const now = new Date();

        const timestamp =
            now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0") +
            String(now.getHours()).padStart(2, "0") +
            String(now.getMinutes()).padStart(2, "0") +
            String(now.getSeconds()).padStart(2, "0");

        // Generate Password
        const password = Buffer.from(
            process.env.MPESA_SHORTCODE +
            process.env.MPESA_PASSKEY +
            timestamp
        ).toString("base64");

        // STK Push Request
        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: paymentAmount,
                PartyA: phone,
                PartyB: process.env.MPESA_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: process.env.MPESA_CALLBACK_URL,
                AccountReference: "CHAMA",
                TransactionDesc: "Contribution Payment"
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );

        return res.status(200).json(response.data);

    } catch (error) {

        console.error(
            "STK PUSH ERROR:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            message: "Failed to initiate M-Pesa payment."
        });

    }

};