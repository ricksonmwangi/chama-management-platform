const axios = require("axios");
const db = require("../config/db");

// Defaults to sandbox unless MPESA_ENV=production is set.
const DARAJA_BASE = process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

const AXIOS_TIMEOUT = 30000;

function getTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return (
        now.getFullYear().toString() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds())
    );
}

// Normalises 07.., 7.., +2547.., 2547.. into the 2547XXXXXXXX format Daraja
// requires. Member phone numbers are stored in whatever format the admin
// typed them in (usually 07XXXXXXXX), so self-service payments need this.
function normalizeKenyanPhone(input) {
    const digits = String(input).replace(/\D/g, "");
    if (digits.startsWith("254")) return digits;
    if (digits.startsWith("0")) return "254" + digits.slice(1);
    if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
    return digits;
}

async function fetchAccessToken() {
    const auth = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const response = await axios.get(
        `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
        { headers: { Authorization: `Basic ${auth}` }, timeout: AXIOS_TIMEOUT }
    );

    return response.data.access_token;
}

// Shared by both the admin ad-hoc push and the self-service "pay my
// contribution" button. memberId is null for the admin flow (arbitrary
// phone, not necessarily tied to a roster entry) and set for self-service
// (so the callback knows to auto-record a contribution).
async function sendStkPush({ phone, amount, memberId = null, accountReference = "GenjeGroup", description = "Chama Payment" }) {

    const accessToken = await fetchAccessToken();
    const timestamp = getTimestamp();
    const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    console.log(`STK push: initiating for ${phone}, amount ${amount}, memberId=${memberId}, env=${DARAJA_BASE}`);

    const response = await axios.post(
        `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
        {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: accountReference,
            TransactionDesc: description
        },
        { headers: { Authorization: `Bearer ${accessToken}` }, timeout: AXIOS_TIMEOUT }
    );

    console.log(`STK push: accepted by Safaricom, CheckoutRequestID=${response.data.CheckoutRequestID}. Waiting for callback at ${process.env.MPESA_CALLBACK_URL}`);

    db.query(
        "INSERT INTO mpesa_transactions (member_id, phone, amount, checkout_request_id) VALUES (?, ?, ?, ?)",
        [memberId, phone, amount, response.data.CheckoutRequestID],
        (err) => { if (err) console.error("Failed to log STK push:", err.message); }
    );

    return response.data;
}

exports.getAccessToken = async (req, res) => {
    try {
        const token = await fetchAccessToken();
        return res.status(200).json({ access_token: token });
    } catch (error) {
        console.error("ACCESS TOKEN ERROR:", error.response?.data || error.message);
        return res.status(500).json({ message: "Failed to retrieve M-Pesa access token." });
    }
};

// Admin/treasurer: ad-hoc push to any phone number, not necessarily linked
// to a member record. Does NOT auto-record a contribution — this is a
// general-purpose "send a payment request" tool, not specifically for
// contributions.
exports.stkPush = async (req, res) => {

    const { phone, amount } = req.body;

    if (!phone || amount === undefined) {
        return res.status(400).json({ message: "Phone and amount are required." });
    }

    if (!/^254(7\d{8}|1\d{8})$/.test(phone)) {
        return res.status(400).json({ message: "Phone must be in the format 2547XXXXXXXX." });
    }

    const paymentAmount = Number(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    try {
        const data = await sendStkPush({ phone, amount: paymentAmount });
        return res.status(200).json({ message: "STK push sent successfully.", data });
    } catch (error) {
        console.error("STK PUSH ERROR:", error.response?.data || error.message);
        return res.status(500).json({ message: "Failed to initiate M-Pesa payment." });
    }

};

// Self-service: any authenticated user whose login is linked to a member
// record can tap this to pay their own contribution — no admin needed.
// Their own phone number is looked up from the roster (never taken from
// the request body, so nobody can trigger a push to someone else's
// phone). Defaults the amount to the chama's configured monthly
// contribution if none is given.
exports.payMyContribution = async (req, res) => {

    db.query(
        "SELECT member_id FROM users WHERE id = ?",
        [req.user.id],
        (err, userResults) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to initiate payment." });
            }

            const memberId = userResults[0] && userResults[0].member_id;

            if (!memberId) {
                return res.status(404).json({
                    message: "Your account isn't linked to a member record yet. Ask an admin to link it."
                });
            }

            db.query(
                "SELECT phone, full_name FROM members WHERE id = ?",
                [memberId],
                async (err, memberResults) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "Failed to initiate payment." });
                    }

                    if (memberResults.length === 0) {
                        return res.status(404).json({ message: "Linked member record not found." });
                    }

                    const phone = normalizeKenyanPhone(memberResults[0].phone);

                    if (!/^254(7\d{8}|1\d{8})$/.test(phone)) {
                        return res.status(400).json({
                            message: "Your phone number on file doesn't look like a valid Kenyan number. Ask an admin to correct it on your member record."
                        });
                    }

                    let paymentAmount = Number(req.body.amount);

                    if (!req.body.amount) {
                        // No amount given — fall back to the chama's configured
                        // monthly contribution.
                        db.query("SELECT monthly_contribution FROM settings WHERE id = 1", async (err, settingsResults) => {

                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: "Failed to initiate payment." });
                            }

                            const defaultAmount = settingsResults[0]
                                ? Number(settingsResults[0].monthly_contribution)
                                : null;

                            if (!defaultAmount || defaultAmount <= 0) {
                                return res.status(400).json({ message: "No amount given, and no default contribution amount is configured." });
                            }

                            await sendAndRespond(defaultAmount);

                        });
                        return;
                    }

                    if (isNaN(paymentAmount) || paymentAmount <= 0) {
                        return res.status(400).json({ message: "Amount must be greater than zero." });
                    }

                    await sendAndRespond(paymentAmount);

                    async function sendAndRespond(amount) {
                        try {
                            const data = await sendStkPush({
                                phone,
                                amount,
                                memberId,
                                accountReference: "Contribution",
                                description: "Chama Contribution"
                            });
                            return res.status(200).json({ message: "Payment request sent to your phone.", data });
                        } catch (error) {
                            console.error("SELF-SERVICE STK PUSH ERROR:", error.response?.data || error.message);
                            return res.status(500).json({ message: "Failed to initiate M-Pesa payment." });
                        }
                    }

                }
            );

        }
    );

};

exports.callback = (req, res) => {

    // Log THE INSTANT a request hits this route, before touching the body
    // at all. If your callback URL is wrong, unreachable, or the tunnel is
    // down, this line will simply never appear.
    console.log(`M-Pesa callback received at ${new Date().toISOString()}`);

    try {

        const callbackData = req.body?.Body?.stkCallback;

        if (!callbackData) {
            console.log("Callback body didn't match the expected shape:", JSON.stringify(req.body));
            return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
        }

        if (callbackData.ResultCode !== 0) {
            console.log(`M-Pesa payment failed/cancelled: ${callbackData.ResultDesc}`);
            return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
        }

        const items = callbackData.CallbackMetadata?.Item || [];
        const get = (name) => items.find((i) => i.Name === name)?.Value;

        const amount = get("Amount");
        const receipt = get("MpesaReceiptNumber");
        const phone = get("PhoneNumber");
        const checkoutId = callbackData.CheckoutRequestID;

        // Find out first whether this transaction is linked to a member
        // (a self-service contribution payment) before updating it, since
        // we need that to decide whether to auto-record a contribution.
        db.query(
            "SELECT member_id FROM mpesa_transactions WHERE checkout_request_id = ?",
            [checkoutId],
            (err, existing) => {

                if (err) console.error("Failed to look up transaction:", err.message);
                const memberId = existing && existing[0] ? existing[0].member_id : null;

                db.query(
                    "UPDATE mpesa_transactions SET receipt_number = ?, phone = ?, amount = ? WHERE checkout_request_id = ?",
                    [receipt, phone, amount, checkoutId],
                    (err, result) => {

                        if (err) {
                            console.error("Failed to update transaction:", err.message);
                            return;
                        }

                        if (result.affectedRows === 0) {
                            db.query(
                                "INSERT INTO mpesa_transactions (phone, amount, receipt_number, checkout_request_id) VALUES (?, ?, ?, ?)",
                                [phone, amount, receipt, checkoutId],
                                (err) => { if (err) console.error("Failed to insert transaction:", err.message); }
                            );
                        }

                        console.log(`M-Pesa payment confirmed: ${phone} paid ${amount}, receipt ${receipt}`);

                        // This was a self-service contribution payment —
                        // record it automatically so nobody has to manually
                        // re-enter it on the Contributions page.
                        if (memberId) {
                            db.query(
                                "INSERT INTO contributions (member_id, amount, contribution_date) VALUES (?, ?, CURDATE())",
                                [memberId, amount],
                                (err) => {
                                    if (err) console.error("Failed to auto-record contribution:", err.message);
                                    else console.log(`Auto-recorded contribution for member ${memberId}: ${amount}`);
                                }
                            );
                        }

                    }
                );

            }
        );

        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

    } catch (error) {
        console.error("CALLBACK ERROR:", error);
        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

};

exports.getTransactions = (req, res) => {

    db.query(
        "SELECT id, member_id, phone, amount, receipt_number, checkout_request_id, created_at FROM mpesa_transactions ORDER BY created_at DESC",
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to retrieve transactions." });
            }

            return res.status(200).json(results);

        }
    );

};
