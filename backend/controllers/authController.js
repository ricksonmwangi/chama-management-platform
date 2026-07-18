const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// Same floor the frontend's strength meter enforces — 8+ characters, at
// least one letter, at least one number. Keep these in sync: the frontend
// utility is frontend/src/utils/passwordStrength.js.
function isPasswordStrongEnough(password) {
    if (typeof password !== "string" || password.length < 8) return false;
    if (!/[A-Za-z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    return true;
}
const PASSWORD_REQUIREMENT_MESSAGE = "Password must be at least 8 characters long and include a letter and a number.";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Verifies a Google reCAPTCHA v2 token server-side. If RECAPTCHA_SECRET_KEY
// isn't set, verification is skipped (registration still works, just
// unprotected) — this is a deliberate fallback for local dev/testing
// before you've set up your own Google reCAPTCHA keys, NOT a safe default
// for production. See README for how to get real keys.
async function verifyCaptcha(token) {

    if (!process.env.RECAPTCHA_SECRET_KEY) {
        console.warn("RECAPTCHA_SECRET_KEY not set — skipping CAPTCHA verification. Registration is unprotected until this is configured.");
        return true;
    }

    if (!token) return false;

    try {
        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            null,
            {
                params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: token },
                timeout: 10000
            }
        );
        return response.data.success === true;
    } catch (error) {
        console.error("CAPTCHA verification error:", error.message);
        return false;
    }

}

exports.register = async (req, res) => {
    try {
        const { username, email, password, captchaToken } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email address." });
        }

        if (!isPasswordStrongEnough(password)) {
            return res.status(400).json({ message: PASSWORD_REQUIREMENT_MESSAGE });
        }

        const captchaOk = await verifyCaptcha(captchaToken);

        if (!captchaOk) {
            return res.status(400).json({ message: "CAPTCHA verification failed. Please try again." });
        }

        db.query(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email],
            async (err, results) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Registration failed." });
                }

                if (results.length > 0) {
                    return res.status(409).json({ message: "Username or email is already in use." });
                }

                try {
                    const passwordHash = await bcrypt.hash(password, 10);
                    const role = "member"; // every public registration becomes a member

                    db.query(
                        "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                        [username, email, passwordHash, role],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: "Registration failed." });
                            }
                            return res.status(201).json({ message: "User registered successfully." });
                        }
                    );
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: "Registration failed." });
                }

            }
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};

exports.login = (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Login failed." });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: "Invalid credentials." });
            }

            const user = results[0];
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                return res.status(401).json({ message: "Invalid credentials." });
            }

            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            return res.status(200).json({ message: "Login successful.", token });

        }
    );

};

exports.getMe = (req, res) => {

    const sql = `
        SELECT
            users.id, users.username, users.email, users.role, users.member_id,
            members.full_name, members.phone, members.email AS member_email, members.join_date,
            members.role AS member_role, members.standing
        FROM users
        LEFT JOIN members ON users.member_id = members.id
        WHERE users.id = ?
    `;

    db.query(sql, [req.user.id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve profile." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json(results[0]);

    });

};

exports.linkMember = (req, res) => {

    const { user_id, member_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ message: "user_id is required." });
    }

    db.query(
        "UPDATE users SET member_id = ? WHERE id = ?",
        [member_id || null, user_id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to link member." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "User not found." });
            }

            return res.status(200).json({
                message: member_id ? "User linked to member successfully." : "User unlinked from member."
            });

        }
    );

};

exports.getAllUsers = (req, res) => {

    db.query(
        `SELECT users.id, users.username, users.email, users.role, users.member_id,
                members.full_name AS linked_member_name
         FROM users
         LEFT JOIN members ON users.member_id = members.id
         ORDER BY users.username ASC`,
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to retrieve users." });
            }

            return res.status(200).json(results);

        }
    );

};

exports.changePassword = async (req, res) => {

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({ message: "Current and new password are required." });
    }

    if (!isPasswordStrongEnough(new_password)) {
        return res.status(400).json({ message: PASSWORD_REQUIREMENT_MESSAGE });
    }

    db.query(
        "SELECT * FROM users WHERE id = ?",
        [req.user.id],
        async (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to change password." });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "User not found." });
            }

            const validPassword = await bcrypt.compare(current_password, results[0].password_hash);

            if (!validPassword) {
                return res.status(401).json({ message: "Current password is incorrect." });
            }

            const newHash = await bcrypt.hash(new_password, 10);

            db.query(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                [newHash, req.user.id],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "Failed to change password." });
                    }
                    return res.status(200).json({ message: "Password changed successfully." });
                }
            );

        }
    );

};
