const db = require("../config/db");

exports.createContribution = (req, res) => {

    const {
        member_id,
        amount,
        contribution_date
    } = req.body;

    if (
        !member_id ||
        !amount ||
        !contribution_date
    ) {
        return res.status(400).json({
            message: "All fields are required"
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
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message:
                "Contribution recorded successfully"
            });
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
            return res.status(500).json(err);
        }

        res.json(results);
    });
};

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
                return res.status(500).json(err);
            }

            res.json(results);
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
                return res.status(500).json(err);
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Member not found"
                });
            }

            res.json(results[0]);
        }
    );
};