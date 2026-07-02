const db = require("../config/db");

// Get Audit Logs
exports.getAuditLogs = (req, res) => {

    // Default pagination values
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const offset = (page - 1) * limit;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM audit_logs
    `;

    db.query(countSql, (err, countResult) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Internal server error."
            });
        }

        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        const sql = `
            SELECT
                id,
                user_id,
                action,
                created_at
            FROM audit_logs
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        db.query(
            sql,
            [limit, offset],
            (err, results) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }

                return res.status(200).json({
                    current_page: page,
                    total_pages: totalPages,
                    total_records: totalRecords,
                    records_returned: results.length,
                    data: results
                });

            }
        );

    });

};