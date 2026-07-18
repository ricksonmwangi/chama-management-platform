import { useEffect, useState } from "react";
import * as loansApi from "../api/loans";
import * as repaymentsApi from "../api/repayments";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Loading, Banner, RestrictedNotice, EmptyState } from "../components/ui";
import { RepeatIcon } from "../components/Icons";

function fmt(n) {
  return "KSh " + Number(n || 0).toLocaleString("en-KE");
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Repayments() {
  const { canViewFinance, canManageFinance } = useAuth();
  const [loans, setLoans] = useState([]);
  const [allRepayments, setAllRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [balance, setBalance] = useState(null);
  const [loanHistory, setLoanHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  function loadAll() {
    setLoading(true);
    Promise.all([loansApi.getLoans(), repaymentsApi.getRepayments()])
      .then(([ln, rep]) => {
        setLoans(ln.filter((l) => l.status === "approved"));
        setAllRepayments(rep);
      })
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load repayments.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (canViewFinance) loadAll(); }, [canViewFinance]);

  if (!canViewFinance) return <RestrictedNotice what="loan repayments" />;

  function loadLoanDetail(id) {
    setSelectedId(id);
    setBalance(null);
    setLoanHistory([]);
    setSuccess("");
    if (!id) return;
    setDetailLoading(true);
    Promise.all([loansApi.getLoanBalance(id), repaymentsApi.getLoanRepayments(id)])
      .then(([bal, hist]) => { setBalance(bal); setLoanHistory(hist); })
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load loan details.")))
      .finally(() => setDetailLoading(false));
  }

  async function handleRecord(e) {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    setSaving(true);
    try {
      await repaymentsApi.recordRepayment({ loan_id: Number(selectedId), amount: Number(amount) });
      setSuccess("Repayment recorded.");
      setAmount("");
      loadLoanDetail(selectedId);
      loadAll();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't record repayment."));
    } finally {
      setSaving(false);
    }
  }

  const totalRepaid = allRepayments.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div>
      <Banner type="error">{error}</Banner>

      <div className="stat-grid">
        <div className="stat-card hero">
          <div className="label">Total Repaid — All Loans</div>
          <div className="value">{fmt(totalRepaid)}</div>
          <div className="delta">{allRepayments.length} repayment{allRepayments.length === 1 ? "" : "s"} recorded</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-head" style={{ marginTop: 0 }}><h2>Record a repayment</h2></div>
          {loading ? (
            <Loading />
          ) : loans.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--slate)" }}>No approved loans to repay yet.</p>
          ) : (
            <div className="field">
              <label>Loan</label>
              <select value={selectedId} onChange={(e) => loadLoanDetail(e.target.value)}>
                <option value="">Select a loan…</option>
                {loans.map((l) => (
                  <option key={l.id} value={l.id}>{l.full_name} — {fmt(l.amount)}</option>
                ))}
              </select>
            </div>
          )}

          {detailLoading && <Loading label="Loading loan details…" />}

          {balance && (
            <div style={{ marginTop: 8 }}>
              <div className="list-row"><span>Loan amount</span><strong className="amount">{fmt(balance.loan_amount)}</strong></div>
              <div className="list-row"><span>Paid so far</span><strong className="amount pos">{fmt(balance.paid_amount)}</strong></div>
              <div className="list-row"><span>Balance remaining</span><strong className="amount neg">{fmt(balance.balance)}</strong></div>

              {canManageFinance && (
                balance.balance > 0 ? (
                  <form onSubmit={handleRecord} style={{ marginTop: 16 }}>
                    <Banner type="error">{formError}</Banner>
                    <Banner type="success">{success}</Banner>
                    <div className="field">
                      <label>Repayment amount (KSh)</label>
                      <input type="number" min="1" max={balance.balance} value={amount} onChange={(e) => setAmount(e.target.value)} required />
                      <div className="hint">Can't exceed the remaining balance of {fmt(balance.balance)}.</div>
                    </div>
                    <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
                      {saving ? "Recording…" : "Record repayment"}
                    </button>
                  </form>
                ) : (
                  <div className="banner banner-success" style={{ marginTop: 12 }}>This loan is fully repaid.</div>
                )
              )}

              <div className="section-head"><h2>This loan's history</h2></div>
              {loanHistory.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "var(--slate)" }}>No repayments recorded on this loan yet.</p>
              ) : (
                loanHistory.map((r) => (
                  <div key={r.id} className="list-row">
                    <span style={{ fontSize: 12.5, color: "var(--slate)" }}>{fmtDate(r.repayment_date)}</span>
                    <strong className="amount pos">{fmt(r.amount)}</strong>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="table-wrap">
          <div className="table-toolbar">
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>All repayments</div>
          </div>
          {loading ? (
            <Loading />
          ) : allRepayments.length === 0 ? (
            <EmptyState icon={<RepeatIcon style={{ width: 32, height: 32 }} />} title="No repayments recorded yet" />
          ) : (
            <table>
              <thead><tr><th>Member</th><th>Loan</th><th>Date</th><th>Amount</th></tr></thead>
              <tbody>
                {allRepayments.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Member" className="cell-nolabel" style={{ fontWeight: 600 }}>{r.full_name}</td>
                    <td data-label="Loan">{r.purpose || `Loan #${r.loan_id}`}</td>
                    <td data-label="Date" className="mono">{fmtDate(r.repayment_date)}</td>
                    <td data-label="Amount" className="amount pos">{fmt(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="table-foot"><span>{allRepayments.length} records</span><span>Total: {fmt(totalRepaid)}</span></div>
        </div>
      </div>
    </div>
  );
}
