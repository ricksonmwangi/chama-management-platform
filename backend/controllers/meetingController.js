const db = require("../config/db");

exports.createMeeting = (req, res) => {

    const { title, description, meeting_date, location } = req.body;

    if (!title || !meeting_date || !location) {
        return res.status(400).json({ message: "Title, date, and location are required." });
    }

    db.query(
        "INSERT INTO meetings (title, description, meeting_date, location) VALUES (?, ?, ?, ?)",
        [title, description || null, meeting_date, location],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to create meeting." });
            }

            return res.status(201).json({ message: "Meeting created successfully.", id: result.insertId });

        }
    );

};

exports.getMeetings = (req, res) => {

    db.query("SELECT * FROM meetings ORDER BY meeting_date DESC", (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve meetings." });
        }

        return res.status(200).json(results);

    });

};

exports.getMeetingById = (req, res) => {

    db.query("SELECT * FROM meetings WHERE id = ?", [req.params.id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve meeting." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Meeting not found." });
        }

        return res.status(200).json(results[0]);

    });

};

exports.updateMeeting = (req, res) => {

    const { title, description, meeting_date, location } = req.body;

    if (!title || !meeting_date || !location) {
        return res.status(400).json({ message: "Title, date, and location are required." });
    }

    db.query(
        "UPDATE meetings SET title = ?, description = ?, meeting_date = ?, location = ? WHERE id = ?",
        [title, description || null, meeting_date, location, req.params.id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to update meeting." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Meeting not found." });
            }

            return res.status(200).json({ message: "Meeting updated successfully." });

        }
    );

};

exports.deleteMeeting = (req, res) => {

    db.query("DELETE FROM meetings WHERE id = ?", [req.params.id], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to delete meeting." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Meeting not found." });
        }

        return res.status(200).json({ message: "Meeting deleted successfully." });

    });

};

// Member sets their own RSVP for a meeting. Uses the caller's linked
// member_id, looked up fresh from the DB (not the JWT).
exports.setMyRsvp = (req, res) => {

    const meetingId = req.params.id;
    const { rsvp } = req.body;

    if (!["yes", "no", "maybe"].includes(rsvp)) {
        return res.status(400).json({ message: "rsvp must be one of: yes, no, maybe." });
    }

    db.query("SELECT member_id FROM users WHERE id = ?", [req.user.id], (err, userResults) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to save RSVP." });
        }

        const memberId = userResults[0] && userResults[0].member_id;

        if (!memberId) {
            return res.status(404).json({
                message: "Your account isn't linked to a member record yet. Ask an admin to link it."
            });
        }

        db.query(
            `INSERT INTO meeting_attendance (meeting_id, member_id, rsvp)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rsvp = VALUES(rsvp)`,
            [meetingId, memberId, rsvp],
            (err) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Failed to save RSVP." });
                }

                return res.status(200).json({ message: "RSVP saved." });

            }
        );

    });

};

// Admin/secretary: full attendance list for a meeting — every member,
// their RSVP (defaults to "maybe" if they never responded), and whether
// they were marked present.
exports.getMeetingAttendance = (req, res) => {

    const sql = `
        SELECT members.id AS member_id, members.full_name,
               COALESCE(meeting_attendance.rsvp, 'maybe') AS rsvp,
               meeting_attendance.attended
        FROM members
        LEFT JOIN meeting_attendance
            ON meeting_attendance.member_id = members.id
            AND meeting_attendance.meeting_id = ?
        ORDER BY members.full_name ASC
    `;

    db.query(sql, [req.params.id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to retrieve attendance." });
        }

        return res.status(200).json(results);

    });

};

// Admin/secretary: mark a specific member present/absent for a meeting.
exports.markAttendance = (req, res) => {

    const meetingId = req.params.id;
    const { member_id, attended } = req.body;

    if (!member_id || typeof attended !== "boolean") {
        return res.status(400).json({ message: "member_id and a boolean attended are required." });
    }

    db.query(
        `INSERT INTO meeting_attendance (meeting_id, member_id, attended)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE attended = VALUES(attended)`,
        [meetingId, member_id, attended],
        (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to mark attendance." });
            }

            return res.status(200).json({ message: "Attendance recorded." });

        }
    );

};
