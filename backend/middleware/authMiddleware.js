const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required."
        });
    }

    const token = header.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

        if (err) {
            return res.status(401).json({
                message: "Invalid or expired token."
            });
        }

        req.user = decoded; // { id, role }
        next();

    });

};
