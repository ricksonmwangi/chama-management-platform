import { useEffect, useState } from "react";
import * as contributionsApi from "../api/contributions";
import * as membersApi from "../api/members";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Loading, Banner, Modal, RestrictedNotice, EmptyState } from "../components/ui";
import { PlusIcon, CoinsIcon } from "../components/Icons";

function fmt(n) {
  return "KSh " + Number(n || 0).toLocaleString("en-KE");
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Contributions() {
  const { canViewFinance, canManageFinance } = useAuth();
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ member_id: "", amount: "", contribution_date: today() });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Member summary lookup tool
  const [lookupId, setLookupId] = useState("");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([contributionsApi.getContributions(), membersApi.getMembers()])
      .then(([contribs, mems]) => { setRows(contribs); setMembers(mems); })
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load contributions.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (canViewFinance) load(); }, [canViewFinance]);

  if (!canViewFinance) return <RestrictedNotice what="contribution records" />;

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  function openModal() {
    setForm({ member_id: members[0]?.id || "", amount: "", contribution_date: today() });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await contributionsApi.createContribution({
        member_id: Number(form.member_id),
        amount: Number(form.amount),
        contribution_date: form.contribution_date,
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't record contribution."));
    } finally {
      setSaving(false);
    }
  }

  function handleLookup(e) {
    e.preventDefault();
    if (!lookupId) return;
    setSummaryLoading(true);
    setSummary(null);
    contributionsApi.getMemberContributionSummary(lookupId)
      .then(setSummary)
      .catch((err) => alert(apiErrorMessage(err, "Couldn't load summary.")))
      .finally(() => setSummaryLoading(false));
  }

  return (
    <div>
      <Banner type="error">{error}</Banner>

      <div className="stat-grid">
        <div className="stat-card hero">
          <div className="label">Total Collected — All Time</div>
          <div className="value">{fmt(total)}</div>
          <div className="delta">{rows.length} contribution{rows.length === 1 ? "" : "s"} recorded</div>
        </div>
      </div>

      <div className="two-col">
        <div className="table-wrap">
          <div className="table-toolbar">
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>All contributions</div>
            {canManageFinance && (
              <button className="btn btn-primary btn-sm" onClick={openModal} disabled={members.length === 0}>
                <PlusIcon /> Record contribution
              </button>
            )}
          </div>
          {loading ? (
            <Loading />
          ) : rows.length === 0 ? (
            <EmptyState icon={<CoinsIcon style={{ width: 32, height: 32 }} />} title="No contributions recorded yet" />
          ) : (
            <table>
              <thead><tr><th>Member</th><th>Date</th><th>Amount</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Member" className="cell-nolabel">
                      <div style={{ fontWeight: 600 }}>{r.full_name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--slate)" }}>{r.phone}</div>
                    </td>
                    <td data-label="Date" className="mono">{new Date(r.contribution_date).toLocaleDateString("en-KE")}</td>
                    <td data-label="Amount" className="amount pos">{fmt(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="table-foot"><span>{rows.length} records</span><span>Total: {fmt(total)}</span></div>
        </div>

        <div className="card">
          <div className="section-head" style={{ marginTop: 0 }}><h2>Member contribution summary</h2></div>
          <form onSubmit={handleLookup}>
            <div className="field">
              <label>Choose a member</label>
              <select value={lookupId} onChange={(e) => setLookupId(e.target.value)}>
                <option value="">Select…</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <button className="btn btn-ghost btn-block" type="submit" disabled={!lookupId || summaryLoading}>
              {summaryLoading ? "Looking up…" : "Look up total"}
            </button>
          </form>
          {summary && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{summary.full_name}</div>
              <div className="amount pos" style={{ fontSize: 20, marginTop: 6 }}>{fmt(summary.total_contributed)}</div>
              <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 3 }}>{summary.total_payments} payment{summary.total_payments === 1 ? "" : "s"} made</div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal
          title="Record contribution"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" form="contrib-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save contribution"}
              </button>
            </>
          }
        >
          <Banner type="error">{formError}</Banner>
          <form id="contrib-form" onSubmit={handleSave}>
            <div className="field">
              <label>Member</label>
              <select value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} required>
                {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Amount (KSh)</label>
                <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" max={today()} value={form.contribution_date} onChange={(e) => setForm({ ...form, contribution_date: e.target.value })} required />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
