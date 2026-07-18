import { useEffect, useState } from "react";
import * as meetingsApi from "../api/meetings";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Loading, Banner, Modal, EmptyState } from "../components/ui";
import { PlusIcon, EditIcon, TrashIcon, CalendarIcon } from "../components/Icons";

const emptyForm = { title: "", description: "", meeting_date: "", location: "" };

export default function Meetings() {
  const { canManageMeetings, me } = useAuth();
  const toast = useToast();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [attendanceFor, setAttendanceFor] = useState(null);

  function load() {
    setLoading(true);
    meetingsApi.getMeetings()
      .then(setMeetings)
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load meetings.")))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openAdd() {
    setForm(emptyForm);
    setFormError("");
    setModal("add");
  }
  function openEdit(m) {
    setForm({ title: m.title, description: m.description || "", meeting_date: m.meeting_date?.slice(0, 10) || "", location: m.location });
    setFormError("");
    setModal(m);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (modal === "add") {
        await meetingsApi.createMeeting(form);
        toast.push("Meeting scheduled.");
      } else {
        await meetingsApi.updateMeeting(modal.id, form);
        toast.push("Meeting updated.");
      }
      setModal(null);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't save meeting."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m) {
    if (!window.confirm(`Delete "${m.title}"?`)) return;
    try {
      await meetingsApi.deleteMeeting(m.id);
      toast.push("Meeting deleted.");
      load();
    } catch (err) {
      toast.push(apiErrorMessage(err, "Couldn't delete meeting."), "error");
    }
  }

  async function handleRsvp(meetingId, rsvp) {
    try {
      await meetingsApi.setMyRsvp(meetingId, rsvp);
      toast.push("RSVP saved.");
    } catch (err) {
      toast.push(apiErrorMessage(err, "Couldn't save RSVP."), "error");
    }
  }

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.meeting_date) >= now);
  const past = meetings.filter((m) => new Date(m.meeting_date) < now);

  return (
    <div>
      <Banner type="error">{error}</Banner>

      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>Upcoming meetings</h2>
        {canManageMeetings && <button className="btn btn-primary btn-sm" onClick={openAdd}><PlusIcon /> Schedule</button>}
      </div>

      {loading ? (
        <Loading />
      ) : upcoming.length === 0 ? (
        <div className="card"><EmptyState icon={<CalendarIcon style={{ width: 32, height: 32 }} />} title="No upcoming meetings scheduled" /></div>
      ) : (
        upcoming.map((m) => (
          <MeetingCard
            key={m.id} m={m} canManage={canManageMeetings} linked={!!me?.member_id}
            onEdit={openEdit} onDelete={handleDelete} onRsvp={handleRsvp}
            onManageAttendance={() => setAttendanceFor(m)}
          />
        ))
      )}

      {past.length > 0 && (
        <>
          <div className="section-head"><h2>Past meetings</h2></div>
          {past.map((m) => (
            <MeetingCard
              key={m.id} m={m} canManage={canManageMeetings} linked={!!me?.member_id}
              onEdit={openEdit} onDelete={handleDelete} onRsvp={handleRsvp}
              onManageAttendance={() => setAttendanceFor(m)}
              muted
            />
          ))}
        </>
      )}

      {modal && (
        <Modal
          title={modal === "add" ? "Schedule a meeting" : "Edit meeting"}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" form="meeting-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <Banner type="error">{formError}</Banner>
          <form id="meeting-form" onSubmit={handleSave}>
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} required />
              </div>
              <div className="field">
                <label>Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </div>
            </div>
            <div className="field">
              <label>Agenda / description</label>
              <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </form>
        </Modal>
      )}

      {attendanceFor && (
        <AttendanceModal meeting={attendanceFor} onClose={() => setAttendanceFor(null)} />
      )}
    </div>
  );
}

function MeetingCard({ m, canManage, linked, onEdit, onDelete, onRsvp, onManageAttendance, muted }) {
  const [rsvp, setRsvp] = useState(null);

  return (
    <div className="card" style={{ marginBottom: 12, opacity: muted ? 0.7 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>{m.title}</div>
          <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 2 }}>
            {new Date(m.meeting_date).toLocaleDateString("en-KE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
            {" · "}{m.location}
          </div>
        </div>
        {canManage && (
          <div className="row-actions">
            <button onClick={onManageAttendance} title="Attendance"><CalendarIcon /></button>
            <button onClick={() => onEdit(m)}><EditIcon /></button>
            <button onClick={() => onDelete(m)}><TrashIcon /></button>
          </div>
        )}
      </div>
      {m.description && <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>{m.description}</p>}

      {!muted && linked && (
        <div style={{ marginTop: 14 }}>
          <div className="page-eyebrow" style={{ marginBottom: 6 }}>Your RSVP</div>
          <div className="rsvp-row">
            {["yes", "maybe", "no"].map((opt) => (
              <button
                key={opt}
                className={`rsvp-btn ${opt}${rsvp === opt ? " active" : ""}`}
                onClick={() => { setRsvp(opt); onRsvp(m.id, opt); }}
              >
                {opt === "yes" ? "Attending" : opt === "no" ? "Can't make it" : "Maybe"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceModal({ meeting, onClose }) {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    meetingsApi.getMeetingAttendance(meeting.id)
      .then(setRows)
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load attendance.")));
  }, [meeting.id]);

  async function mark(memberId, attended) {
    try {
      await meetingsApi.markAttendance(meeting.id, memberId, attended);
      setRows((rs) => rs.map((r) => r.member_id === memberId ? { ...r, attended } : r));
    } catch (err) {
      toast.push(apiErrorMessage(err, "Couldn't mark attendance."), "error");
    }
  }

  return (
    <Modal title={`Attendance — ${meeting.title}`} onClose={onClose}>
      <Banner type="error">{error}</Banner>
      {rows === null ? (
        <Loading />
      ) : (
        rows.map((r) => (
          <div key={r.member_id} className="list-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{r.full_name}</div>
              <div style={{ fontSize: 11, color: "var(--slate)", textTransform: "capitalize" }}>RSVP: {r.rsvp}</div>
            </div>
            <div className="attend-toggle">
              <button className={r.attended === true ? "active present" : ""} onClick={() => mark(r.member_id, true)}>Present</button>
              <button className={r.attended === false ? "active absent" : ""} onClick={() => mark(r.member_id, false)}>Absent</button>
            </div>
          </div>
        ))
      )}
    </Modal>
  );
}
