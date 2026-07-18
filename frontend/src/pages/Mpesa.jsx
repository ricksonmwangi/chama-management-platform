import { useEffect, useState } from "react";
import * as mpesaApi from "../api/mpesa";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Banner, RestrictedNotice, Loading, EmptyState, Stamp } from "../components/ui";
import { SendIcon, PhoneIcon } from "../components/Icons";

function fmt(n) {
  return "KSh " + Number(n || 0).toLocaleString("en-KE");
}

export default function Mpesa() {
  const { canManageFinance } = useAuth();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transactions, setTransactions] = useState(null);
  const [txError, setTxError] = useState("");

  function loadTransactions() {
    mpesaApi.getTransactions()
      .then(setTransactions)
      .catch((err) => setTxError(apiErrorMessage(err, "Couldn't load transactions.")));
  }

  useEffect(() => { if (canManageFinance) loadTransactions(); }, [canManageFinance]);

  if (!canManageFinance) return <RestrictedNotice what="M-Pesa payment tools" />;

  async function handleSend(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSending(true);
    try {
      await mpesaApi.stkPush(mpesaApi.normalizeKenyanPhone(phone), Number(amount));
      setSuccess("STK push sent. Ask the member to check their phone and enter their M-Pesa PIN.");
      setAmount("");
      setTimeout(loadTransactions, 1500);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't send the STK push."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="two-col">
        <div className="card">
          <div className="section-head" style={{ marginTop: 0 }}><h2>Send STK push</h2></div>
          <Banner type="error">{error}</Banner>
          <Banner type="success">{success}</Banner>
          <form onSubmit={handleSend}>
            <div className="field">
              <label>Phone number</label>
              <input type="tel" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <div className="hint">Any Kenyan format works — converted to 2547XXXXXXXX automatically.</div>
            </div>
            <div className="field">
              <label>Amount (KSh)</label>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <button className="btn btn-gold btn-block" type="submit" disabled={sending}>
              <SendIcon /> {sending ? "Sending…" : "Send payment request"}
            </button>
          </form>
        </div>

        <div className="table-wrap">
          <div className="table-toolbar">
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>Recent transactions</div>
          </div>
          <Banner type="error">{txError}</Banner>
          {transactions === null ? (
            <Loading />
          ) : transactions.length === 0 ? (
            <EmptyState icon={<PhoneIcon style={{ width: 32, height: 32 }} />} title="No M-Pesa transactions yet" />
          ) : (
            <table>
              <thead><tr><th>Phone</th><th>Amount</th><th>Receipt</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td data-label="Phone" className="mono">{t.phone}</td>
                    <td data-label="Amount" className="amount">{fmt(t.amount)}</td>
                    <td data-label="Receipt" className="mono">{t.receipt_number || "—"}</td>
                    <td data-label="Time" className="mono">{new Date(t.created_at).toLocaleString("en-KE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td data-label="Status"><Stamp tone={t.receipt_number ? "success" : "pending"}>{t.receipt_number ? "Confirmed" : "Pending"}</Stamp></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
