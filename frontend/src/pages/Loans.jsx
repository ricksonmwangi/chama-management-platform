import { useEffect, useState } from "react";
import * as loansApi from "../api/loans";
import * as membersApi from "../api/members";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Loading, Banner, Stamp, Modal, RestrictedNotice, EmptyState } from "../components/ui";
import { PlusIcon, NoteIcon } from "../components/Icons";

function fmt(n) {
  return "KSh " + Number(n || 0).toLocaleString("en-KE");
}

const TONE = { approved: "active", pending: "pending", rejected: "rejected" };

export default function Loans() {
  const { canViewFinance, canManageFinance } = useAuth();
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ member_id: "", amount: "", purpose: "", term_months: "6", guarantors: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [balanceFor, setBalanceFor] = useState(null); // loan row
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([loansApi.getLoans(), membersApi.getMembers()])
      .then(([ln, mem]) => { setLoans(ln); setMembers(mem); })
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load loans.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (canViewFinance) load(); }, [canViewFinance]);

  if (!canViewFinance) return <RestrictedNotice what="loan records" />;

  const outstanding = loans.filter((l) => l.status === "approved").length;

  function openModal() {
    setForm({ member_id: members[0]?.id || "", amount: "", purpose: "", term_months: "6", guarantors: "" });
    setFormError("");
    setModalOpen(true);
  }

  async function handleApply(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await loansApi.applyLoan({
        member_id: Number(form.member_id),
        amount: Number(form.amount),
        purpose: form.purpose || null,
        term_months: form.term_months ? Number(form.term_months) : null,
        guarantors: form.guarantors || null,
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't submit loan application."));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(loan) {
    setBusyId(loan.id);
    try {
      await loansApi.approveLoan(loan.id);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Couldn't approve loan."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(loan) {
    if (!window.confirm(`Reject this loan application for ${loan.full_name}?`)) return;
    setBusyId(loan.id);
    try {
      await loansApi.rejectLoan(loan.id);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, "Couldn't reject loan."));
    } finally {
      setBusyId(null);
    }
  }

  function openBalance(loan) {
    setBalanceFor(loan);
    setBalance(null);
    setBalanceLoading(true);
    loansApi.getLoanBalance(loan.id)
      .then(setBalance)
      .catch((err) => alert(apiErrorMessage(err, "Couldn't load balance.")))
      .finally(() => setBalanceLoading(false));
  }

  return (
    <div>
      <Banner type="error">{error}</Banner>

      <div className="stat-grid">
        <StatRow label="Total Loans" value={loans.length} />
        <StatRow label="Active (Approved)" value={outstanding} />
        <StatRow label="Pending Applications" value={loans.filter((l) => l.status === "pending").length} />
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>All loans</div>
          {canManageFinance && (
            <button className="btn btn-primary btn-sm" onClick={openModal} disabled={members.length === 0}>
              <PlusIcon /> New loan request
            </button>
          )}
        </div>
        {loading ? (
          <Loading />
        ) : loans.length === 0 ? (
          <EmptyState icon={<NoteIcon style={{ width: 32, height: 32 }} />} title="No loans yet" />
        ) : (
          <table>
            <thead><tr><th>Member</th><th>Purpose</th><th>Principal</th><th>Applied</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id}>
                  <td data-label="Member" className="cell-nolabel" style={{ fontWeight: 600 }}>{l.full_name}</td>
                  <td data-label="Purpose">{l.purpose || "—"}</td>
                  <td data-label="Principal" className="amount">{fmt(l.amount)}</td>
                  <td data-label="Applied" className="mono">{new Date(l.application_date).toLocaleDateString("en-KE")}</td>
                  <td data-label="Status"><Stamp tone={TONE[l.status] || "closed"}>{l.status}</Stamp></td>
                  <td data-label="">
                    <div className="row-actions" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openBalance(l)}>Balance</button>
                      {canManageFinance && l.status === "pending" && (
                        <>
                          <button className="btn btn-primary btn-sm" disabled={busyId === l.id} onClick={() => handleApprove(l)}>Approve</button>
                          <button className="btn btn-danger btn-sm" disabled={busyId === l.id} onClick={() => handleReject(l)}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal
          title="New loan request"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" form="loan-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Submitting…" : "Submit for approval"}
              </button>
            </>
          }
        >
          <Banner type="error">{formError}</Banner>
          <form id="loan-form" onSubmit={handleApply}>
            <div className="field">
              <label>Member</label>
              <select value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} required>
                {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Principal (KSh)</label>
                <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                <div className="hint">Capped at 3x the member's total contributions.</div>
              </div>
              <div className="field">
                <label>Term (months)</label>
                <select value={form.term_months} onChange={(e) => setForm({ ...form, term_months: e.target.value })}>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Purpose</label>
              <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. School fees" />
            </div>
            <div className="field">
              <label>Guarantors</label>
              <input value={form.guarantors} onChange={(e) => setForm({ ...form, guarantors: e.target.value })} placeholder="e.g. Grace Wanjiru, Peter Otieno" />
            </div>
          </form>
        </Modal>
      )}

      {balanceFor && (
        <Modal title={`Balance — ${balanceFor.full_name}`} onClose={() => setBalanceFor(null)}>
          {balanceLoading ? (
            <Loading />
          ) : balance ? (
            <div>
              <div className="list-row"><span>Loan amount</span><strong className="amount">{fmt(balance.loan_amount)}</strong></div>
              <div className="list-row"><span>Paid so far</span><strong className="amount pos">{fmt(balance.paid_amount)}</strong></div>
              <div className="list-row"><span>Balance remaining</span><strong className="amount neg">{fmt(balance.balance)}</strong></div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--slate)" }}>Couldn't load balance.</p>
          )}
        </Modal>
      )}
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
