const db = require("../config/db");

exports.getMembers = (req, res) => {
    db.query(
        "SELECT * FROM members",
        (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );
};

exports.createMember = (req, res) => {

    if (!req.body) {
        return res.status(400).json({
            message: "Request body is missing"
        });
    }

    const { full_name, phone, email, join_date } = req.body;

    console.log(full_name);
    console.log(phone);
    console.log(email);
    console.log(join_date);


    const sql = `
        INSERT INTO members
        (full_name, phone, email, join_date)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [full_name, phone, email, join_date],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Member created successfully"
            });
        }
    );
};

exports.getMemberById = (req, res) => {

    const { id } = req.params;

    db.query(
        "SELECT * FROM members WHERE id = ?",
        [id],
        (err, results) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Member not found"
                });
            }

            res.json(results[0]);
        }
    );
};

exports.updateMember = (req, res) => {

    const { id } = req.params;

    const {
        full_name,
        phone,
        email
    } = req.body;

    const sql = `
        UPDATE members
        SET full_name = ?, phone = ?, email = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [full_name, phone, email, id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Member not found"
                });
            }

            res.json({
                message: "Member updated successfully"
            });
        }
    );
};

exports.deleteMember = (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM members WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Member not found"
                });
            }

            res.json({
                message: "Member deleted successfully"
            });
        }
    );
};