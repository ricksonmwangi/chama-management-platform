const db = require("../config/db");

exports.logAction = (action) => {

    return (req, res, next) => {

        if (!action) {
            return next();
        }

        const userId = req.user?.id || null;

        db.query(
            "INSERT INTO audit_logs (user_id, action) VALUES (?, ?)",
            [userId, action],
            (err) => {
                if (err) {
                    console.error("Audit log failed:", err.message);
                }
            }
        );

        // Continue immediately without waiting
        next();

    };

};