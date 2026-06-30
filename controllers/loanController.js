const db = require("../config/db");

exports.applyLoan = (req, res) => {

    const { member_id, amount } = req.body;

    if (!member_id || !amount) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const contributionSql = `
        SELECT
            COALESCE(SUM(amount), 0) AS total_contributed
        FROM contributions
        WHERE member_id = ?
    `;

    db.query(
        contributionSql,
        [member_id],
        (err, results) => {

            if (err) {
                return res.status(500).json(err);
            }

            const totalContributed =
                Number(results[0].total_contributed);

            const maxLoan =
                totalContributed * 3;

            if (amount > maxLoan) {

                return res.status(400).json({
                    message:
                    `Loan exceeds eligibility limit. Maximum allowed is ${maxLoan}`
                });

            }

            const loanSql = `
                INSERT INTO loans
                (
                    member_id,
                    amount,
                    application_date
                )
                VALUES (?, ?, CURDATE())
            `;

            db.query(
                loanSql,
                [member_id, amount],
                (err, result) => {

                    if (err) {
                        return res.status(500).json(err);
                    }

                    res.json({
                        message:
                        "Loan application submitted successfully"
                    });

                }
            );

        }
    );
};

exports.getLoans = (req, res) => {

    const sql = `
        SELECT
            loans.id,
            members.full_name,
            loans.amount,
            loans.status,
            loans.application_date
        FROM loans
        INNER JOIN members
            ON loans.member_id = members.id
        ORDER BY loans.application_date DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json(err);
        }

        res.json(results);

    });
};

exports.approveLoan = (req, res) => {

    const loanId = req.params.id;

    const sql = `
        UPDATE loans
        SET status = 'approved'
        WHERE id = ?
    `;

    db.query(
        sql,
        [loanId],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Loan not found"
                });
            }

            res.json({
                message: "Loan approved successfully"
            });

        }
    );
};

exports.rejectLoan = (req, res) => {

    const loanId = req.params.id;

    const sql = `
        UPDATE loans
        SET status = 'rejected'
        WHERE id = ?
    `;

    db.query(
        sql,
        [loanId],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Loan not found"
                });
            }

            res.json({
                message: "Loan rejected successfully"
            });

        }
    );
};

exports.getLoanBalance = (req, res) => {

    const loanId = req.params.id;

    const sql = `
        SELECT
            loans.id,
            loans.amount AS loan_amount,
            COALESCE(SUM(loan_repayments.amount), 0) AS paid_amount,
            loans.amount -
            COALESCE(SUM(loan_repayments.amount), 0)
            AS balance
        FROM loans
        LEFT JOIN loan_repayments
            ON loans.id = loan_repayments.loan_id
        WHERE loans.id = ?
        GROUP BY loans.id, loans.amount
    `;

    db.query(
        sql,
        [loanId],
        (err, results) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Loan not found"
                });
            }

            res.json(results[0]);
        }
    );
};