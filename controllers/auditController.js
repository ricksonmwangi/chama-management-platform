const db = require("../config/db");

exports.getAuditLogs = (req, res) => {

    const sql = `
        SELECT *
        FROM audit_logs
        ORDER BY created_at DESC
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(results);

        }
    );
};