const db = require("../config/db");

// Lets the request through if the user is an admin (always a superuser),
// OR if their linked member record has one of the given chama roles.
// Looked up fresh from the DB each time — not from the JWT — since a
// member's role or link can change after their token was issued.
//
// Usage: roleMiddleware.allowRoles("treasurer")
//        roleMiddleware.allowRoles("secretary", "chairperson")
exports.allowRoles = (...roles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({ message: "Authentication required." });
        }

        if (req.user.role === "admin") {
            return next();
        }

        db.query(
            `SELECT members.role AS member_role
             FROM users
             LEFT JOIN members ON users.member_id = members.id
             WHERE users.id = ?`,
            [req.user.id],
            (err, results) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Internal server error." });
                }

                const memberRole = results[0]?.member_role;

                if (memberRole && roles.includes(memberRole)) {
                    return next();
                }

                return res.status(403).json({
                    message: `Access denied. Requires one of: ${roles.join(", ")} (or admin).`
                });

            }
        );

    };

};
