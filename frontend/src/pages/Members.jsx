import { useEffect, useState } from "react";
import * as membersApi from "../api/members";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Loading, Banner, Stamp, Modal, RestrictedNotice, EmptyState } from "../components/ui";
import { PlusIcon, EditIcon, TrashIcon, UsersIcon } from "../components/Icons";

const ROLES = ["member", "committee", "treasurer", "secretary", "chairperson"];
const STANDINGS = ["good", "pending", "overdue"];

const emptyForm = { full_name: "", phone: "", email: "", join_date: "", role: "member", standing: "good" };

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function Members() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | "add" | member object being edited
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function load() {
    setLoading(true);
    membersApi.getMembers()
      .then(setMembers)
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load members.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) return <RestrictedNotice what="the member registry" />;

  function openAdd() {
    setForm(emptyForm);
    setFormError("");
    setModal("add");
  }
  function openEdit(m) {
    setForm({ full_name: m.full_name, phone: m.phone, email: m.email, join_date: m.join_date || "", role: m.role || "member", standing: m.standing || "good" });
    setFormError("");
    setModal(m);
  }
  function closeModal() { setModal(null); }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (modal === "add") {
        await membersApi.createMember(form);
      } else {
        await membersApi.updateMember(modal.id, form);
      }
      closeModal();
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't save member."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m) {
    if (!window.confirm(`Remove ${m.full_name} from the registry? This can't be undone.`)) return;
    try {
      await membersApi.deleteMember(m.id);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Couldn't delete member."));
    }
  }

  return (
    <div>
      <Banner type="error">{error}</Banner>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{members.length} member{members.length === 1 ? "" : "s"}</div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><PlusIcon /> Add member</button>
        </div>

        {loading ? (
          <Loading />
        ) : members.length === 0 ? (
          <EmptyState icon={<UsersIcon style={{ width: 32, height: 32 }} />} title="No members yet">
            Add your first member to get started.
          </EmptyState>
        ) : (
          <table>
            <thead><tr><th>Member</th><th>Role</th><th>Joined</th><th>Standing</th><th></th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td data-label="Member" className="cell-nolabel">
                    <div className="cell-member">
                      <div className="mini-avatar">{initials(m.full_name)}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.full_name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--slate)" }}>{m.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Role" style={{ textTransform: "capitalize" }}>{m.role || "member"}</td>
                  <td data-label="Joined" className="mono">{m.join_date ? new Date(m.join_date).toLocaleDateString("en-KE") : "—"}</td>
                  <td data-label="Standing">
                    <Stamp tone={m.standing === "overdue" ? "overdue" : m.standing === "pending" ? "pending" : "paid"}>
                      {m.standing || "good"}
                    </Stamp>
                  </td>
                  <td data-label="">
                    <div className="row-actions">
                      <button onClick={() => openEdit(m)} aria-label="Edit"><EditIcon /></button>
                      <button onClick={() => handleDelete(m)} aria-label="Delete"><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === "add" ? "Add member" : "Edit member"}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" form="member-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : modal === "add" ? "Add member" : "Save changes"}
              </button>
            </>
          }
        >
          <Banner type="error">{formError}</Banner>
          <form id="member-form" onSubmit={handleSave}>
            <div className="field">
              <label>Full name</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0722445810" required />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            {modal === "add" && (
              <div className="field">
                <label>Joining date</label>
                <input type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} required />
              </div>
            )}
            <div className="field-row">
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {modal !== "add" && (
                <div className="field">
                  <label>Standing</label>
                  <select value={form.standing} onChange={(e) => setForm({ ...form, standing: e.target.value })}>
                    {STANDINGS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
