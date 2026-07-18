const db = require("../config/db");

exports.getSettings = (req, res) => {

    db.query("SELECT * FROM settings WHERE id = 1", (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve settings." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Settings haven't been initialised." });
        }

        return res.status(200).json(results[0]);

    });

};

exports.updateSettings = (req, res) => {

    const {
        chama_name, monthly_contribution, loan_interest_rate,
        loan_multiplier, meeting_frequency, grace_period_days
    } = req.body;

    if (monthly_contribution !== undefined && Number(monthly_contribution) <= 0) {
        return res.status(400).json({ message: "Monthly contribution must be greater than zero." });
    }

    if (loan_multiplier !== undefined && Number(loan_multiplier) <= 0) {
        return res.status(400).json({ message: "Loan multiplier must be greater than zero." });
    }

    if (loan_interest_rate !== undefined && Number(loan_interest_rate) < 0) {
        return res.status(400).json({ message: "Interest rate can't be negative." });
    }

    if (grace_period_days !== undefined && Number(grace_period_days) < 0) {
        return res.status(400).json({ message: "Grace period can't be negative." });
    }

    const sql = `
        UPDATE settings SET
            chama_name = COALESCE(?, chama_name),
            monthly_contribution = COALESCE(?, monthly_contribution),
            loan_interest_rate = COALESCE(?, loan_interest_rate),
            loan_multiplier = COALESCE(?, loan_multiplier),
            meeting_frequency = COALESCE(?, meeting_frequency),
            grace_period_days = COALESCE(?, grace_period_days)
        WHERE id = 1
    `;

    db.query(
        sql,
        [
            chama_name ?? null,
            monthly_contribution ?? null,
            loan_interest_rate ?? null,
            loan_multiplier ?? null,
            meeting_frequency ?? null,
            grace_period_days ?? null
        ],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to update settings." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Settings haven't been initialised." });
            }

            return res.status(200).json({ message: "Settings updated successfully." });

        }
    );

};
