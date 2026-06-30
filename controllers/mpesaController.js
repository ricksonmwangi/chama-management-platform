const axios = require("axios");
const db = require("../config/db");

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
                }
            }
        );

        res.json(response.data);

    } catch (error) {

        res.status(500).json({
            message: "Failed to get access token",
            error: error.message
        });

    }

};

exports.callback = async (req, res) => {

    try {

        console.log(
            "FULL CALLBACK:",
            JSON.stringify(req.body, null, 2)
        );

        const callback = req.body.Body.stkCallback;

        console.log(
            "Callback:",
            JSON.stringify(callback, null, 2)
        );

        console.log(
            "ResultCode:",
            callback.ResultCode
        );

        if (callback.ResultCode == 0) {

            const items =
                callback.CallbackMetadata.Item;

            let amount = null;
            let phone = null;
            let receipt = null;

            items.forEach(item => {
                if (callback.ResultCode != 0) {
                   console.log(
                   "Payment failed:",
                   callback.ResultDesc
                          );
                }                

                if (item.Name === "Amount") {
                    amount = item.Value;
                }

                if (item.Name === "MpesaReceiptNumber") {
                    receipt = item.Value;
                }

                if (item.Name === "PhoneNumber") {
                    phone = item.Value;
                }
                

            });

            console.log({
                phone,
                amount,
                receipt,
                checkoutRequestID:
                    callback.CheckoutRequestID
            });

            db.query(
                `INSERT INTO mpesa_transactions
                (phone, amount, receipt_number, checkout_request_id)
                VALUES (?, ?, ?, ?)`,
                [
                    phone,
                    amount,
                    receipt,
                    callback.CheckoutRequestID
                ],
                (err, result) => {

                    if (err) {
                        console.error(
                            "DB ERROR:",
                            err
                        );
                    } else {
                        console.log(
                            "Transaction saved successfully"
                        );
                    }

                }
            );

        }

        res.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });

    } catch (error) {

        console.error(
            "CALLBACK ERROR:",
            error
        );

        res.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });

    }

};

exports.stkPush = async (req, res) => {

    try {

        const { phone, amount } = req.body;

        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString("base64");

        const tokenResponse = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }
        );

        const accessToken =
            tokenResponse.data.access_token;

        const timestamp =
            new Date()
            .toISOString()
            .replace(/[-:TZ.]/g, "")
            .slice(0, 14);

        const password = Buffer.from(
            process.env.MPESA_SHORTCODE +
            process.env.MPESA_PASSKEY +
            timestamp
        ).toString("base64");

        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode:
                    process.env.MPESA_SHORTCODE,

                Password:
                    password,

                Timestamp:
                    timestamp,

                TransactionType:
                    "CustomerPayBillOnline",

                Amount:
                    amount,

                PartyA:
                    phone,

                PartyB:
                    process.env.MPESA_SHORTCODE,

                PhoneNumber:
                    phone,

                CallBackURL:
                    "https://stamp-overbid-barrier.ngrok-free.dev/mpesa/callback",

                AccountReference:
                    "CHAMA",

                TransactionDesc:
                    "Contribution Payment"
            },
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

        res.json(response.data);

    } catch (error) {

        console.error(error.response?.data || error);

        res.status(500).json(
            error.response?.data || error.message
        );

    }

};