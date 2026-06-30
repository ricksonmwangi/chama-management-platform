const db = require("../config/db");

exports.createMeeting = (req, res) => {

    const {
        title,
        description,
        meeting_date,
        location
    } = req.body;

    const sql = `
        INSERT INTO meetings
        (
            title,
            description,
            meeting_date,
            location
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            title,
            description,
            meeting_date,
            location
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message:
                "Meeting created successfully"
            });

        }
    );
};

exports.getMeetings = (req, res) => {

    db.query(
        "SELECT * FROM meetings ORDER BY meeting_date DESC",
        (err, results) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(results);

        }
    );
};

exports.getMeetingById = (req, res) => {

    const id = req.params.id;

    db.query(
        "SELECT * FROM meetings WHERE id = ?",
        [id],
        (err, results) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Meeting not found"
                });
            }

            res.json(results[0]);
        }
    );
};

exports.updateMeeting = (req, res) => {

    const id = req.params.id;

    const {
        title,
        description,
        meeting_date,
        location
    } = req.body;

    const sql = `
        UPDATE meetings
        SET
            title = ?,
            description = ?,
            meeting_date = ?,
            location = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            title,
            description,
            meeting_date,
            location,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message:
                "Meeting updated successfully"
            });

        }
    );
};

exports.deleteMeeting = (req, res) => {

    const id = req.params.id;

    db.query(
        "DELETE FROM meetings WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message:
                "Meeting deleted successfully"
            });

        }
    );
};