const db = require("../config/db");

exports.applyLoan = (req, res) => {

    const { member_id, amount, purpose, term_months, guarantors } = req.body;

    if (!member_id || amount === undefined) {
        return res.status(400).json({ message: "Member ID and loan amount are required." });
    }

    const loanAmount = Number(amount);

    if (isNaN(loanAmount) || loanAmount <= 0) {
        return res.status(400).json({ message: "Loan amount must be greater than zero." });
    }

    db.query("SELECT id FROM members WHERE id = ?", [member_id], (err, memberResult) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal server error." });
        }

        if (memberResult.length === 0) {
            return res.status(404).json({ message: "Member not found." });
        }

        db.query(
            "SELECT id FROM loans WHERE member_id = ? AND status = 'approved' LIMIT 1",
            [member_id],
            (err, activeLoan) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Internal server error." });
                }

                if (activeLoan.length > 0) {
                    return res.status(409).json({ message: "Member already has an active approved loan." });
                }

                db.query(
                    "SELECT COALESCE(SUM(amount),0) AS total_contributed FROM contributions WHERE member_id = ?",
                    [member_id],
                    (err, contributionResult) => {

                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "Internal server error." });
                        }

                        const totalContributed = Number(contributionResult[0].total_contributed);

                        db.query("SELECT loan_multiplier FROM settings WHERE id = 1", (err, settingsResult) => {

                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: "Internal server error." });
                            }

                            const multiplier = settingsResult.length > 0
                                ? Number(settingsResult[0].loan_multiplier)
                                : 3;

                            const maximumLoan = totalContributed * multiplier;

                            if (loanAmount > maximumLoan) {
                                return res.status(400).json({
                                    message: `Loan exceeds eligibility limit. Maximum allowed is ${maximumLoan}.`
                                });
                            }

                            db.query(
                                `INSERT INTO loans (member_id, amount, application_date, purpose, term_months, guarantors)
                                 VALUES (?, ?, CURDATE(), ?, ?, ?)`,
                                [member_id, loanAmount, purpose || null, term_months ? Number(term_months) : null, guarantors || null],
                                (err, result) => {

                                    if (err) {
                                        console.error(err);
                                        return res.status(500).json({ message: "Internal server error." });
                                    }

                                    return res.status(201).json({
                                        message: "Loan application submitted successfully.",
                                        id: result.insertId
                                    });

                                }
                            );

                        });

                    }
                );

            }
        );

    });

};

exports.getLoans = (req, res) => {

    const sql = `
        SELECT loans.id, loans.member_id, members.full_name, loans.amount, loans.status,
               loans.application_date, loans.purpose, loans.term_months, loans.guarantors
        FROM loans
        INNER JOIN members ON loans.member_id = members.id
        ORDER BY loans.application_date DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal server error." });
        }

        return res.status(200).json(results);

    });

};

exports.approveLoan = (req, res) => {

    const loanId = req.params.id;

    db.query("SELECT id, status FROM loans WHERE id = ?", [loanId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal server error." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Loan not found." });
        }

        if (results[0].status !== "pending") {
            return res.status(409).json({ message: "Only pending loans can be approved." });
        }

        db.query("UPDATE loans SET status = 'approved' WHERE id = ?", [loanId], (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Internal server error." });
            }

            return res.status(200).json({ message: "Loan approved successfully." });

        });

    });

};

exports.rejectLoan = (req, res) => {

    const loanId = req.params.id;

    db.query("SELECT id, status FROM loans WHERE id = ?", [loanId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal server error." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Loan not found." });
        }

        if (results[0].status !== "pending") {
            return res.status(409).json({ message: "Only pending loans can be rejected." });
        }

        db.query("UPDATE loans SET status = 'rejected' WHERE id = ?", [loanId], (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Internal server error." });
            }

            return res.status(200).json({ message: "Loan rejected successfully." });

        });

    });

};

exports.getLoanBalance = (req, res) => {

    const loanId = req.params.id;

    const sql = `
        SELECT loans.id, loans.amount AS loan_amount,
               COALESCE(SUM(loan_repayments.amount),0) AS paid_amount,
               loans.amount - COALESCE(SUM(loan_repayments.amount),0) AS balance
        FROM loans
        LEFT JOIN loan_repayments ON loans.id = loan_repayments.loan_id
        WHERE loans.id = ?
        GROUP BY loans.id, loans.amount
    `;

    db.query(sql, [loanId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal server error." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Loan not found." });
        }

        return res.status(200).json(results[0]);

    });

};

// Self-service: loans for whichever member the logged-in user's account is linked to.
exports.getMyLoans = (req, res) => {

    db.query("SELECT member_id FROM users WHERE id = ?", [req.user.id], (err, userResults) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal server error." });
        }

        const memberId = userResults[0] && userResults[0].member_id;

        if (!memberId) {
            return res.status(404).json({
                message: "Your account isn't linked to a member record yet. Ask an admin to link it."
            });
        }

        const sql = `
            SELECT loans.id, loans.amount, loans.status, loans.application_date,
                   loans.purpose, loans.term_months, loans.guarantors
            FROM loans
            WHERE loans.member_id = ?
            ORDER BY loans.application_date DESC
        `;

        db.query(sql, [memberId], (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Internal server error." });
            }

            return res.status(200).json(results);

        });

    });

};
