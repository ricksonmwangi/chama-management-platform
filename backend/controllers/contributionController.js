const db = require("../config/db");

const isValidAmount = (amount) => typeof amount === "number" ? amount > 0 : Number(amount) > 0;
const isValidContributionDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return d <= today;
};

exports.createContribution = (req, res) => {

    const { member_id, amount, contribution_date } = req.body;

    if (!member_id || !amount || !contribution_date) {
        return res.status(400).json({ message: "All fields are required." });
    }

    if (!isValidAmount(amount)) {
        return res.status(400).json({ message: "Contribution amount must be greater than zero." });
    }

    if (!isValidContributionDate(contribution_date)) {
        return res.status(400).json({ message: "Contribution date cannot be in the future." });
    }

    db.query("SELECT id FROM members WHERE id = ?", [member_id], (err, memberResults) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to record contribution." });
        }

        if (memberResults.length === 0) {
            return res.status(404).json({ message: "Member not found." });
        }

        db.query(
            "INSERT INTO contributions (member_id, amount, contribution_date) VALUES (?, ?, ?)",
            [member_id, amount, contribution_date],
            (err, result) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Failed to record contribution." });
                }

                return res.status(201).json({ message: "Contribution recorded successfully.", id: result.insertId });

            }
        );

    });

};

exports.getContributions = (req, res) => {

    const sql = `
        SELECT contributions.id, contributions.member_id, members.full_name, members.phone,
               contributions.amount, contributions.contribution_date
        FROM contributions
        INNER JOIN members ON contributions.member_id = members.id
        ORDER BY contributions.contribution_date DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve contributions." });
        }

        return res.status(200).json(results);

    });

};

exports.getMemberContributions = (req, res) => {

    const sql = `
        SELECT members.full_name, contributions.id, contributions.amount, contributions.contribution_date
        FROM contributions
        INNER JOIN members ON contributions.member_id = members.id
        WHERE members.id = ?
        ORDER BY contribution_date DESC
    `;

    db.query(sql, [req.params.id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve contributions." });
        }

        return res.status(200).json(results);

    });

};

exports.getMemberContributionSummary = (req, res) => {

    const sql = `
        SELECT members.id, members.full_name,
               COUNT(contributions.id) AS total_payments,
               COALESCE(SUM(contributions.amount), 0) AS total_contributed
        FROM members
        LEFT JOIN contributions ON contributions.member_id = members.id
        WHERE members.id = ?
        GROUP BY members.id, members.full_name
    `;

    db.query(sql, [req.params.id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve summary." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Member not found." });
        }

        return res.status(200).json(results[0]);

    });

};

// Self-service: contributions for whichever member the logged-in user's
// account is linked to. Looked up fresh from the DB, not from the JWT.
exports.getMyContributions = (req, res) => {

    db.query("SELECT member_id FROM users WHERE id = ?", [req.user.id], (err, userResults) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve contributions." });
        }

        const memberId = userResults[0] && userResults[0].member_id;

        if (!memberId) {
            return res.status(404).json({
                message: "Your account isn't linked to a member record yet. Ask an admin to link it."
            });
        }

        const sql = `
            SELECT members.full_name, contributions.id, contributions.amount, contributions.contribution_date
            FROM contributions
            INNER JOIN members ON contributions.member_id = members.id
            WHERE members.id = ?
            ORDER BY contribution_date DESC
        `;

        db.query(sql, [memberId], (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to retrieve contributions." });
            }

            return res.status(200).json(results);

        });

    });

};
