const db = require("../config/db");

exports.getDashboardStats = (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM members) AS total_members,
            (SELECT COALESCE(SUM(amount),0) FROM contributions) AS total_contributions,
            (SELECT COUNT(*) FROM loans) AS total_loans,
            (SELECT COALESCE(SUM(amount),0) FROM loans) AS total_loan_amount,
            (SELECT COUNT(*) FROM loans WHERE status = 'approved') AS approved_loans,
            (SELECT COUNT(*) FROM loans WHERE status = 'pending') AS pending_loans,
            (SELECT COUNT(*) FROM loans WHERE status = 'rejected') AS rejected_loans,
            (SELECT COALESCE(SUM(amount),0) FROM loan_repayments) AS total_repayments,
            (
                SELECT COALESCE(SUM(loans.amount),0) - (SELECT COALESCE(SUM(amount),0) FROM loan_repayments)
                FROM loans WHERE loans.status = 'approved'
            ) AS outstanding_loans
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve dashboard stats." });
        }

        return res.status(200).json(results[0]);

    });

};
