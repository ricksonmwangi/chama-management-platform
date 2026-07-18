const db = require("../config/db");

exports.recordRepayment = (req, res) => {

    const { loan_id, amount } = req.body;

    if (!loan_id || amount === undefined) {
        return res.status(400).json({ message: "Loan ID and amount are required." });
    }

    const repaymentAmount = Number(amount);

    if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
        return res.status(400).json({ message: "Repayment amount must be greater than zero." });
    }

    const balanceSql = `
        SELECT loans.id, loans.status, loans.amount AS loan_amount,
               COALESCE(SUM(loan_repayments.amount),0) AS paid_amount,
               loans.amount - COALESCE(SUM(loan_repayments.amount),0) AS balance
        FROM loans
        LEFT JOIN loan_repayments ON loans.id = loan_repayments.loan_id
        WHERE loans.id = ?
        GROUP BY loans.id, loans.amount, loans.status
    `;

    db.query(balanceSql, [loan_id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to record repayment." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Loan not found." });
        }

        const loan = results[0];

        if (loan.status !== "approved") {
            return res.status(409).json({ message: "Only approved loans can receive repayments." });
        }

        if (repaymentAmount > Number(loan.balance)) {
            return res.status(400).json({
                message: `Repayment exceeds outstanding balance of ${loan.balance}.`
            });
        }

        db.query(
            "INSERT INTO loan_repayments (loan_id, amount) VALUES (?, ?)",
            [loan_id, repaymentAmount],
            (err, result) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Failed to record repayment." });
                }

                return res.status(201).json({ message: "Repayment recorded successfully.", id: result.insertId });

            }
        );

    });

};

exports.getRepayments = (req, res) => {

    const sql = `
        SELECT loan_repayments.id, loan_repayments.loan_id, loan_repayments.amount,
               loan_repayments.repayment_date, loans.amount AS loan_amount, loans.purpose,
               members.id AS member_id, members.full_name, members.phone
        FROM loan_repayments
        INNER JOIN loans ON loan_repayments.loan_id = loans.id
        INNER JOIN members ON loans.member_id = members.id
        ORDER BY loan_repayments.repayment_date DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve repayments." });
        }

        return res.status(200).json(results);

    });

};

exports.getLoanRepayments = (req, res) => {

    const sql = `
        SELECT id, loan_id, amount, repayment_date
        FROM loan_repayments
        WHERE loan_id = ?
        ORDER BY repayment_date DESC
    `;

    db.query(sql, [req.params.id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve repayments." });
        }

        return res.status(200).json(results);

    });

};
