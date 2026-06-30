const db = require("../config/db");

// Validate email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate Kenyan phone numbers
const isValidPhone = (phone) => {
    const phoneRegex = /^(?:\+254|254|0)(7\d{8}|1\d{8})$/;
    return phoneRegex.test(phone);
};

// Get all members
exports.getMembers = (req, res) => {

    db.query(
        "SELECT * FROM members",
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to retrieve members."
                });
            }

            return res.status(200).json(results);

        }
    );

};

// Create member
exports.createMember = (req, res) => {

    const {
        full_name,
        phone,
        email,
        join_date
    } = req.body;

    if (!full_name || !phone || !email || !join_date) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: "Invalid email address."
        });
    }

    if (!isValidPhone(phone)) {
        return res.status(400).json({
            message: "Invalid phone number."
        });
    }

    db.query(
        "SELECT id FROM members WHERE email = ?",
        [email],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to create member."
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    message: "Email already exists."
                });
            }

            db.query(
                `INSERT INTO members
                (full_name, phone, email, join_date)
                VALUES (?, ?, ?, ?)`,
                [full_name, phone, email, join_date],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Failed to create member."
                        });
                    }

                    return res.status(201).json({
                        message: "Member created successfully."
                    });

                }
            );

        }
    );

};

// Get member by ID
exports.getMemberById = (req, res) => {

    const { id } = req.params;

    db.query(
        "SELECT * FROM members WHERE id = ?",
        [id],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to retrieve member."
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

// Update member
exports.updateMember = (req, res) => {

    const { id } = req.params;

    const {
        full_name,
        phone,
        email
    } = req.body;

    if (!full_name || !phone || !email) {
        return res.status(400).json({
            message: "Full name, phone and email are required."
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: "Invalid email address."
        });
    }

    if (!isValidPhone(phone)) {
        return res.status(400).json({
            message: "Invalid phone number."
        });
    }

    db.query(
        "SELECT id FROM members WHERE email = ? AND id != ?",
        [email, id],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to update member."
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    message: "Email already exists."
                });
            }

            db.query(
                `UPDATE members
                 SET full_name = ?, phone = ?, email = ?
                 WHERE id = ?`,
                [full_name, phone, email, id],
                (err, result) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Failed to update member."
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            message: "Member not found."
                        });
                    }

                    return res.status(200).json({
                        message: "Member updated successfully."
                    });

                }
            );

        }
    );

};

// Delete member
exports.deleteMember = (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM members WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to delete member."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Member not found."
                });
            }

            return res.status(200).json({
                message: "Member deleted successfully."
            });

        }
    );

};