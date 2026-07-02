const db = require("../config/db");

// Record Loan Repayment
exports.recordRepayment = (req, res) => {

    const { loan_id, amount } = req.body;

    if (!loan_id || amount === undefined) {
        return res.status(400).json({
            message: "Loan ID and repayment amount are required."
        });
    }

    const repaymentAmount = Number(amount);

    if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
        return res.status(400).json({
            message: "Repayment amount must be greater than zero."
        });
    }

    // Check loan exists
    const loanSql = `
        SELECT
            id,
            amount,
            status
        FROM loans
        WHERE id = ?
    `;

    db.query(loanSql, [loan_id], (err, loanResult) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Internal server error."
            });
        }

        if (loanResult.length === 0) {
            return res.status(404).json({
                message: "Loan not found."
            });
        }

        const loan = loanResult[0];

        if (loan.status !== "approved") {
            return res.status(400).json({
                message: "Repayments can only be made for approved loans."
            });
        }

        // Calculate amount already repaid
        const repaymentSql = `
            SELECT
                COALESCE(SUM(amount),0) AS total_paid
            FROM loan_repayments
            WHERE loan_id = ?
        `;

        db.query(repaymentSql, [loan_id], (err, repaymentResult) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            const totalPaid = Number(repaymentResult[0].total_paid);
            const outstandingBalance = Number(loan.amount) - totalPaid;

            if (outstandingBalance <= 0) {
                return res.status(400).json({
                    message: "This loan has already been fully repaid."
                });
            }

            if (repaymentAmount > outstandingBalance) {
                return res.status(400).json({
                    message: `Repayment exceeds outstanding balance of ${outstandingBalance}.`
                });
            }

            const insertSql = `
                INSERT INTO loan_repayments
                (
                    loan_id,
                    amount,
                    repayment_date
                )
                VALUES (?, ?, CURDATE())
            `;

            db.query(insertSql, [loan_id, repaymentAmount], (err) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }

                return res.status(201).json({
                    message: "Repayment recorded successfully."
                });

            });

        });

    });

};