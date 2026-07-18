const db = require("../config/db");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// People type phone numbers with spaces/dashes ("0101 128768", "0700-556-231")
// — strip those before validating, rather than rejecting a genuine number
// over formatting.
const normalizePhone = (phone) => String(phone).replace(/[\s-]/g, "");
const isValidPhone = (phone) => /^(?:\+254|254|0)(7\d{8}|1\d{8})$/.test(normalizePhone(phone));

const ALLOWED_ROLES = ["member", "committee", "treasurer", "secretary", "chairperson"];
const ALLOWED_STANDINGS = ["good", "pending", "overdue"];

exports.getMembers = (req, res) => {

    db.query("SELECT * FROM members ORDER BY full_name ASC", (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve members." });
        }

        return res.status(200).json(results);

    });

};

exports.getMemberById = (req, res) => {

    db.query("SELECT * FROM members WHERE id = ?", [req.params.id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve member." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Member not found." });
        }

        return res.status(200).json(results[0]);

    });

};

exports.createMember = (req, res) => {

    const { full_name, phone, email, join_date, role } = req.body;

    if (!full_name || !phone || !email || !join_date) {
        return res.status(400).json({ message: "All fields are required." });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email address." });
    }

    if (!isValidPhone(phone)) {
        return res.status(400).json({ message: "Invalid phone number." });
    }

    const memberRole = ALLOWED_ROLES.includes(role) ? role : "member";

    db.query("SELECT id FROM members WHERE email = ?", [email], (err, existing) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to create member." });
        }

        if (existing.length > 0) {
            return res.status(409).json({ message: "A member with this email already exists." });
        }

        db.query(
            `INSERT INTO members (full_name, phone, email, join_date, role, standing)
             VALUES (?, ?, ?, ?, ?, 'good')`,
            [full_name, normalizePhone(phone), email, join_date, memberRole],
            (err, result) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Failed to create member." });
                }

                return res.status(201).json({ message: "Member created successfully.", id: result.insertId });

            }
        );

    });

};

exports.updateMember = (req, res) => {

    const { id } = req.params;
    const { full_name, phone, email, role, standing } = req.body;

    if (!full_name || !phone || !email) {
        return res.status(400).json({ message: "Full name, phone and email are required." });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email address." });
    }

    if (!isValidPhone(phone)) {
        return res.status(400).json({ message: "Invalid phone number." });
    }

    const memberRole = ALLOWED_ROLES.includes(role) ? role : "member";
    const memberStanding = ALLOWED_STANDINGS.includes(standing) ? standing : "good";

    db.query("SELECT id FROM members WHERE email = ? AND id != ?", [email, id], (err, existing) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to update member." });
        }

        if (existing.length > 0) {
            return res.status(409).json({ message: "Another member already uses this email." });
        }

        db.query(
            `UPDATE members SET full_name = ?, phone = ?, email = ?, role = ?, standing = ? WHERE id = ?`,
            [full_name, normalizePhone(phone), email, memberRole, memberStanding, id],
            (err, result) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Failed to update member." });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Member not found." });
                }

                return res.status(200).json({ message: "Member updated successfully." });

            }
        );

    });

};

exports.deleteMember = (req, res) => {

    const { id } = req.params;

    db.query("DELETE FROM members WHERE id = ?", [id], (err, result) => {

        if (err) {
            console.error(err);

            // Expected, common case: member has contributions/loans/etc.
            // referencing them. Give a real explanation, not a generic 500.
            if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
                return res.status(409).json({
                    message: "Can't delete this member — they have contributions, loans, or other records on file. Remove or reassign those first."
                });
            }

            return res.status(500).json({ message: "Failed to delete member." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Member not found." });
        }

        return res.status(200).json({ message: "Member deleted successfully." });

    });

};
