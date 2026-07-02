const db = require("../config/db");

exports.getDashboardStats = (req, res) => {

    const stats = {};

    // Total Members
    db.query(
        "SELECT COUNT(*) AS total_members FROM members",
        (err, memberResults) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            stats.total_members = memberResults[0].total_members;

            // Total Contributions
            db.query(
                "SELECT COALESCE(SUM(amount),0) AS total_contributions FROM contributions",
                (err, contributionResults) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Internal server error."
                        });
                    }

                    stats.total_contributions = Number(
                        contributionResults[0].total_contributions
                    );

                    // Total Loans
                    db.query(
                        "SELECT COUNT(*) AS total_loans FROM loans",
                        (err, loanResults) => {

                            if (err) {
                                console.error(err);
                                return res.status(500).json({
                                    message: "Internal server error."
                                });
                            }

                            stats.total_loans = loanResults[0].total_loans;

                            // Total Loan Amount
                            db.query(
                                "SELECT COALESCE(SUM(amount),0) AS total_loan_amount FROM loans",
                                (err, amountResults) => {

                                    if (err) {
                                        console.error(err);
                                        return res.status(500).json({
                                            message: "Internal server error."
                                        });
                                    }

                                    stats.total_loan_amount = Number(
                                        amountResults[0].total_loan_amount
                                    );

                                    // Approved Loans
                                    db.query(
                                        "SELECT COUNT(*) AS approved_loans FROM loans WHERE status='approved'",
                                        (err, approvedResults) => {

                                            if (err) {
                                                console.error(err);
                                                return res.status(500).json({
                                                    message: "Internal server error."
                                                });
                                            }

                                            stats.approved_loans =
                                                approvedResults[0].approved_loans;

                                            // Pending Loans
                                            db.query(
                                                "SELECT COUNT(*) AS pending_loans FROM loans WHERE status='pending'",
                                                (err, pendingResults) => {

                                                    if (err) {
                                                        console.error(err);
                                                        return res.status(500).json({
                                                            message: "Internal server error."
                                                        });
                                                    }

                                                    stats.pending_loans =
                                                        pendingResults[0].pending_loans;

                                                    // Rejected Loans
                                                    db.query(
                                                        "SELECT COUNT(*) AS rejected_loans FROM loans WHERE status='rejected'",
                                                        (err, rejectedResults) => {

                                                            if (err) {
                                                                console.error(err);
                                                                return res.status(500).json({
                                                                    message: "Internal server error."
                                                                });
                                                            }

                                                            stats.rejected_loans =
                                                                rejectedResults[0].rejected_loans;

                                                            // Total Repayments
                                                            db.query(
                                                                "SELECT COALESCE(SUM(amount),0) AS total_repayments FROM loan_repayments",
                                                                (err, repaymentResults) => {

                                                                    if (err) {
                                                                        console.error(err);
                                                                        return res.status(500).json({
                                                                            message: "Internal server error."
                                                                        });
                                                                    }

                                                                    stats.total_repayments = Number(
                                                                        repaymentResults[0].total_repayments
                                                                    );

                                                                    // Outstanding Loan Balance
                                                                    stats.outstanding_loans =
                                                                        stats.total_loan_amount -
                                                                        stats.total_repayments;

                                                                    return res.status(200).json(stats);

                                                                }
                                                            );

                                                        }
                                                    );

                                                }
                                            );

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

};