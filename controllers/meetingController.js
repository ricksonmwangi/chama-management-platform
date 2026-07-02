const db = require("../config/db");

// Create Meeting
exports.createMeeting = (req, res) => {

    const {
        title,
        description,
        meeting_date,
        location
    } = req.body;

    if (!title || !meeting_date || !location) {
        return res.status(400).json({
            message: "Title, meeting date and location are required."
        });
    }

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
            title.trim(),
            description || null,
            meeting_date,
            location.trim()
        ],
        (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            return res.status(201).json({
                message: "Meeting created successfully."
            });

        }
    );
};

// Get All Meetings
exports.getMeetings = (req, res) => {

    db.query(
        "SELECT * FROM meetings ORDER BY meeting_date DESC",
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            return res.status(200).json(results);

        }
    );

};

// Get Meeting By ID
exports.getMeetingById = (req, res) => {

    const id = req.params.id;

    db.query(
        "SELECT * FROM meetings WHERE id = ?",
        [id],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Meeting not found."
                });
            }

            return res.status(200).json(results[0]);

        }
    );

};

// Update Meeting
exports.updateMeeting = (req, res) => {

    const id = req.params.id;

    const {
        title,
        description,
        meeting_date,
        location
    } = req.body;

    if (!title || !meeting_date || !location) {
        return res.status(400).json({
            message: "Title, meeting date and location are required."
        });
    }

    db.query(
        "SELECT id FROM meetings WHERE id = ?",
        [id],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Meeting not found."
                });
            }

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
                    title.trim(),
                    description || null,
                    meeting_date,
                    location.trim(),
                    id
                ],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Internal server error."
                        });
                    }

                    return res.status(200).json({
                        message: "Meeting updated successfully."
                    });

                }
            );

        }
    );

};

// Delete Meeting
exports.deleteMeeting = (req, res) => {

    const id = req.params.id;

    db.query(
        "SELECT id FROM meetings WHERE id = ?",
        [id],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Meeting not found."
                });
            }

            db.query(
                "DELETE FROM meetings WHERE id = ?",
                [id],
                (err) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Internal server error."
                        });
                    }

                    return res.status(200).json({
                        message: "Meeting deleted successfully."
                    });

                }
            );

        }
    );

};