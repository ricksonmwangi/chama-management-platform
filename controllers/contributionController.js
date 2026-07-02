const db = require("../config/db");

const isValidAmount = (amount) => {
    return !isNaN(amount) && Number(amount) > 0;
};

const isValidContributionDate = (date) => {
    const contributionDate = new Date(date);
    const today = new Date();

    contributionDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return contributionDate <= today;
};

exports.createContribution = (req, res) => {

    const {
        member_id,
        amount,
        contribution_date
    } = req.body;

    if (!member_id || !amount || !contribution_date) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    if (!isValidAmount(amount)) {
        return res.status(400).json({
            message: "Contribution amount must be greater than zero."
        });
    }

    if (!isValidContributionDate(contribution_date)) {
        return res.status(400).json({
            message: "Contribution date cannot be in the future."
        });
    }

    db.query(
        "SELECT id FROM members WHERE id = ?",
        [member_id],
        (err, memberResults) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to record contribution."
                });
            }

            if (memberResults.length === 0) {
                return res.status(404).json({
                    message: "Member not found."
                });
            }

            const sql = `
                INSERT INTO contributions
                (
                    member_id,
                    amount,
                    contribution_date
                )
                VALUES (?, ?, ?)
            `;

            db.query(
                sql,
                [
                    member_id,
                    amount,
                    contribution_date
                ],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Failed to record contribution."
                        });
                    }

                    return res.status(201).json({
                        message: "Contribution recorded successfully."
                    });

                }
            );

        }
    );

};

exports.getContributions = (req, res) => {

    const sql = `
        SELECT
            contributions.id,
            members.id AS member_id,
            members.full_name,
            members.phone,
            contributions.amount,
            contributions.contribution_date
        FROM contributions
        INNER JOIN members
            ON contributions.member_id = members.id
        ORDER BY contributions.contribution_date DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to retrieve contributions."
            });
        }

        return res.status(200).json(results);

    });

};

// Get contributions for one member
exports.getMemberContributions = (req, res) => {

    const memberId = req.params.id;

    const sql = `
        SELECT
            members.full_name,
            contributions.id,
            contributions.amount,
            contributions.contribution_date
        FROM contributions
        INNER JOIN members
            ON contributions.member_id = members.id
        WHERE members.id = ?
        ORDER BY contribution_date DESC
    `;

    db.query(
        sql,
        [memberId],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to retrieve contributions."
                });
            }

            return res.status(200).json(results);

        }
    );

};

exports.getMemberContributionSummary = (req, res) => {

    const memberId = req.params.id;

    const sql = `
        SELECT
            members.id,
            members.full_name,
            COUNT(contributions.id) AS total_payments,
            COALESCE(SUM(contributions.amount), 0) AS total_contributed
        FROM members
        LEFT JOIN contributions
            ON members.id = contributions.member_id
        WHERE members.id = ?
        GROUP BY members.id, members.full_name
    `;

    db.query(
        sql,
        [memberId],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to retrieve contribution summary."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Member not found."
                });
            }

            return res.status(200).json(results[0]);

        }
    );

};