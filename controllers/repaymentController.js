const db = require("../config/db");

exports.recordRepayment = (req, res) => {

    const {
        loan_id,
        amount
    } = req.body;

    if (!loan_id || !amount) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const sql = `
        INSERT INTO loan_repayments
        (
            loan_id,
            amount,
            repayment_date
        )
        VALUES (?, ?, CURDATE())
    `;

    db.query(
        sql,
        [loan_id, amount],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message:
                "Repayment recorded successfully"
            });

        }
    );
};