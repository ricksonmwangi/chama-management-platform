const db = require("../config/db");

exports.getAuditLogs = (req, res) => {

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    db.query("SELECT COUNT(*) AS total FROM audit_logs", (err, countResult) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve audit logs." });
        }

        const total = countResult[0].total;

        db.query(
            "SELECT id, user_id, action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [limit, offset],
            (err, results) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Failed to retrieve audit logs." });
                }

                return res.status(200).json({
                    current_page: page,
                    total_pages: Math.max(1, Math.ceil(total / limit)),
                    total_records: total,
                    records_returned: results.length,
                    data: results
                });

            }
        );

    });

};
