const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register User
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            });
        }

        // Check if username already exists
        db.query(
            "SELECT id FROM users WHERE username = ?",
            [username],
            async (err, results) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Registration failed."
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        message: "Username already exists."
                    });
                }

                try {

                    const passwordHash = await bcrypt.hash(password, 10);

                    // Every public registration becomes a MEMBER
                    const role = "member";

                    db.query(
                        `INSERT INTO users (username, password_hash, role)
                         VALUES (?, ?, ?)`,
                        [username, passwordHash, role],
                        (err) => {

                            if (err) {
                                console.error(err);
                                return res.status(500).json({
                                    message: "Registration failed."
                                });
                            }

                            return res.status(201).json({
                                message: "User registered successfully."
                            });

                        }
                    );

                } catch (error) {

                    console.error(error);

                    return res.status(500).json({
                        message: "Registration failed."
                    });

                }

            }
        );

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Internal Server Error."
        });

    }
};

// Login User
exports.login = (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required."
        });
    }

    db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Login failed."
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid credentials."
                });
            }

            const user = results[0];

            const validPassword = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!validPassword) {
                return res.status(401).json({
                    message: "Invalid credentials."
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );

            return res.status(200).json({
                message: "Login successful.",
                token
            });

        }
    );

};