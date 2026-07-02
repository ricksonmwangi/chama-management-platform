const db = require("../config/db");

// Apply for a loan
exports.applyLoan = (req, res) => {
    const { member_id, amount } = req.body;

    if (!member_id || amount === undefined) {
        return res.status(400).json({
            message: "Member ID and loan amount are required."
        });
    }

    const loanAmount = Number(amount);

    if (isNaN(loanAmount) || loanAmount <= 0) {
        return res.status(400).json({
            message: "Loan amount must be greater than zero."
        });
    }

    // Check member exists
    const memberSql = `
        SELECT id
        FROM members
        WHERE id = ?
    `;

    db.query(memberSql, [member_id], (err, memberResult) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Internal server error."
            });
        }

        if (memberResult.length === 0) {
            return res.status(404).json({
                message: "Member not found."
            });
        }

        // Check for existing approved loan
        const activeLoanSql = `
            SELECT id
            FROM loans
            WHERE member_id = ?
            AND status = 'approved'
            LIMIT 1
        `;

        db.query(activeLoanSql, [member_id], (err, activeLoan) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            if (activeLoan.length > 0) {
                return res.status(409).json({
                    message: "Member already has an active approved loan."
                });
            }

            // Calculate eligibility
            const contributionSql = `
                SELECT
                    COALESCE(SUM(amount),0) AS total_contributed
                FROM contributions
                WHERE member_id = ?
            `;

            db.query(contributionSql, [member_id], (err, contributionResult) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }

                const totalContributed = Number(contributionResult[0].total_contributed);

                const maximumLoan = totalContributed * 3;

                if (loanAmount > maximumLoan) {
                    return res.status(400).json({
                        message: `Loan exceeds eligibility limit. Maximum allowed is ${maximumLoan}.`
                    });
                }

                const insertSql = `
                    INSERT INTO loans
                    (
                        member_id,
                        amount,
                        application_date
                    )
                    VALUES (?, ?, CURDATE())
                `;

                db.query(insertSql, [member_id, loanAmount], (err) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Internal server error."
                        });
                    }

                    return res.status(201).json({
                        message: "Loan application submitted successfully."
                    });

                });

            });

        });

    });

};

// Get all loans
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
            console.error(err);
            return res.status(500).json({
                message: "Internal server error."
            });
        }

        return res.status(200).json(results);

    });

};

// Approve loan
exports.approveLoan = (req, res) => {

    const loanId = req.params.id;

    const checkSql = `
        SELECT
            id,
            status
        FROM loans
        WHERE id = ?
    `;

    db.query(checkSql, [loanId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Internal server error."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Loan not found."
            });
        }

        if (results[0].status !== "pending") {
            return res.status(409).json({
                message: "Only pending loans can be approved."
            });
        }

        const updateSql = `
            UPDATE loans
            SET status = 'approved'
            WHERE id = ?
        `;

        db.query(updateSql, [loanId], (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            return res.status(200).json({
                message: "Loan approved successfully."
            });

        });

    });

};

// Reject loan
exports.rejectLoan = (req, res) => {

    const loanId = req.params.id;

    const checkSql = `
        SELECT
            id,
            status
        FROM loans
        WHERE id = ?
    `;

    db.query(checkSql, [loanId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Internal server error."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Loan not found."
            });
        }

        if (results[0].status !== "pending") {
            return res.status(409).json({
                message: "Only pending loans can be rejected."
            });
        }

        const updateSql = `
            UPDATE loans
            SET status = 'rejected'
            WHERE id = ?
        `;

        db.query(updateSql, [loanId], (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            return res.status(200).json({
                message: "Loan rejected successfully."
            });

        });

    });

};

// Loan balance
exports.getLoanBalance = (req, res) => {

    const loanId = req.params.id;

    const sql = `
        SELECT
            loans.id,
            loans.amount AS loan_amount,
            COALESCE(SUM(loan_repayments.amount),0) AS paid_amount,
            loans.amount - COALESCE(SUM(loan_repayments.amount),0) AS balance
        FROM loans
        LEFT JOIN loan_repayments
            ON loans.id = loan_repayments.loan_id
        WHERE loans.id = ?
        GROUP BY loans.id, loans.amount
    `;

    db.query(sql, [loanId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Internal server error."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Loan not found."
            });
        }

        return res.status(200).json(results[0]);

    });

};