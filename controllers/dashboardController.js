const db = require("../config/db");

exports.getDashboardStats = (req, res) => {

    const stats = {};

    db.query(
        "SELECT COUNT(*) AS total_members FROM members",
        (err, memberResults) => {

            if (err) {
                return res.status(500).json(err);
            }

            stats.total_members =
                memberResults[0].total_members;

            db.query(
                "SELECT COALESCE(SUM(amount), 0) AS total_contributions FROM contributions",
                (err, contributionResults) => {

                    if (err) {
                        return res.status(500).json(err);
                    }

                    stats.total_contributions =
                        contributionResults[0].total_contributions;

                    db.query(
                        "SELECT COUNT(*) AS total_loans FROM loans",
                        (err, loanResults) => {

                            if (err) {
                                return res.status(500).json(err);
                            }

                            stats.total_loans =
                                loanResults[0].total_loans;

                            db.query(
                                "SELECT COALESCE(SUM(amount), 0) AS total_loan_amount FROM loans",
                                (err, amountResults) => {

                                    if (err) {
                                        return res.status(500).json(err);
                                    }

                                    stats.total_loan_amount =
                                        amountResults[0].total_loan_amount;

                                    res.json(stats);
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};