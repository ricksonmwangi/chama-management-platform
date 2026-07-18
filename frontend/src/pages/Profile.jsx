import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as authApi from "../api/auth";
import * as membersApi from "../api/members";
import * as contributionsApi from "../api/contributions";
import * as loansApi from "../api/loans";
import * as mpesaApi from "../api/mpesa";
import * as settingsApi from "../api/settings";
import { apiErrorMessage } from "../api/client";
import { Loading, Banner, Stamp } from "../components/ui";
import { KeyIcon, SendIcon } from "../components/Icons";
import PasswordInput from "../components/PasswordInput";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { checkPasswordStrength } from "../utils/passwordStrength";

function fmt(n) {
  return "KSh " + Number(n || 0).toLocaleString("en-KE");
}

export default function Profile() {
  const { user, isAdmin, logout, refreshMe } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [myContributions, setMyContributions] = useState(null);
  const [myLoans, setMyLoans] = useState(null);

  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");
  const [defaultContribution, setDefaultContribution] = useState(null);

  useEffect(() => {
    settingsApi.getSettings().then((s) => setDefaultContribution(Number(s.monthly_contribution))).catch(() => {});
  }, []);

  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [linkUserId, setLinkUserId] = useState("");
  const [linkMemberId, setLinkMemberId] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  function loadMe() {
    setLoading(true);
    authApi.getMe()
      .then((data) => {
        setMe(data);
        if (data.member_id) {
          contributionsApi.getMyContributions().then(setMyContributions).catch(() => {});
          loansApi.getMyLoans().then(setMyLoans).catch(() => {});
        }
      })
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load your profile.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMe();
    if (isAdmin) {
      authApi.getAllUsers().then(setUsers).catch(() => {});
      membersApi.getMembers().then(setMembers).catch(() => {});
    }
  }, [isAdmin]);

  async function handlePayContribution(e) {
    e.preventDefault();
    setPayError("");
    setPaySuccess("");
    setPaying(true);
    try {
      await mpesaApi.payMyContribution(payAmount ? Number(payAmount) : undefined);
      setPaySuccess("Payment request sent — check your phone and enter your M-Pesa PIN.");
      setPayAmount("");
      // Confirmation arrives async (you have to approve on your phone,
      // then Safaricom calls our server) — refresh a little later so the
      // new contribution shows up without needing a manual reload.
      setTimeout(() => {
        contributionsApi.getMyContributions().then(setMyContributions).catch(() => {});
      }, 15000);
    } catch (err) {
      setPayError(apiErrorMessage(err, "Couldn't send the payment request."));
    } finally {
      setPaying(false);
    }
  }

  async function handleLink(e) {
    e.preventDefault();
    setLinkError("");
    setLinking(true);
    try {
      await authApi.linkMember(Number(linkUserId), linkMemberId ? Number(linkMemberId) : null);
      toast.push("Account linked.");
      authApi.getAllUsers().then(setUsers).catch(() => {});
      if (String(linkUserId) === String(user?.id)) { loadMe(); refreshMe(); }
    } catch (err) {
      setLinkError(apiErrorMessage(err, "Couldn't link account."));
    } finally {
      setLinking(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    if (!checkPasswordStrength(pwForm.new_password).meetsMinimum) {
      setPwError("New password needs at least 8 characters, including a letter and a number.");
      return;
    }
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("New passwords don't match.");
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword(pwForm.current_password, pwForm.new_password);
      toast.push("Password changed.");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPwError(apiErrorMessage(err, "Couldn't change password."));
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) return <Loading label="Loading profile…" />;

  return (
    <div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 20, background: "var(--ink)", borderRadius: "var(--radius-l)", color: "#fff", marginBottom: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--gold)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
          {(me?.full_name || me?.username || "U").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>{me?.full_name || me?.username}</div>
          <div style={{ fontSize: 12, color: "#c9cfc7", marginTop: 2, textTransform: "capitalize" }}>
            {me?.role} account{me?.member_role ? ` · ${me.member_role}` : ""}
          </div>
        </div>
      </div>

      <Banner type="error">{error}</Banner>

      {!me?.member_id && (
        <div className="banner" style={{ background: "var(--gold-tint)", color: "#7a5a26" }}>
          Your login isn't linked to a member record yet. {isAdmin ? "Link it below." : "Ask your chama's admin to link it."}
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="section-head" style={{ marginTop: 0 }}><h2>Account</h2></div>
          <div className="list-row"><span style={{ fontSize: 13.5 }}>Username</span><span className="mono">{me?.username}</span></div>
          <div className="list-row"><span style={{ fontSize: 13.5 }}>Role</span><span className="mono" style={{ textTransform: "capitalize" }}>{me?.role}</span></div>
          {me?.email && <div className="list-row"><span style={{ fontSize: 13.5 }}>Email</span><span className="mono">{me.email}</span></div>}
          {me?.phone && <div className="list-row"><span style={{ fontSize: 13.5 }}>Phone</span><span className="mono">{me.phone}</span></div>}
          {me?.member_email && me.member_email !== me.email && (
            <div className="list-row"><span style={{ fontSize: 13.5 }}>Roster email</span><span className="mono">{me.member_email}</span></div>
          )}
          {me?.standing && (
            <div className="list-row">
              <span style={{ fontSize: 13.5 }}>Standing</span>
              <Stamp tone={me.standing === "overdue" ? "overdue" : me.standing === "pending" ? "pending" : "paid"}>{me.standing}</Stamp>
            </div>
          )}
          <button className="btn btn-danger btn-block" style={{ marginTop: 14 }} onClick={() => { logout(); navigate("/login"); }}>
            Sign out
          </button>
        </div>

        <div className="card">
          <div className="section-head" style={{ marginTop: 0 }}><h2><KeyIcon style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 5 }} />Change password</h2></div>
          <Banner type="error">{pwError}</Banner>
          <form onSubmit={handleChangePassword}>
            <div className="field">
              <label>Current password</label>
              <PasswordInput value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required />
            </div>
            <div className="field">
              <label>New password</label>
              <PasswordInput value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required />
              <PasswordStrengthMeter password={pwForm.new_password} />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <PasswordInput value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              {pwForm.confirm.length > 0 && pwForm.confirm !== pwForm.new_password && (
                <div className="error">Passwords don't match yet.</div>
              )}
            </div>
            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={pwSaving || !checkPasswordStrength(pwForm.new_password).meetsMinimum || pwForm.new_password !== pwForm.confirm}
            >
              {pwSaving ? "Saving…" : "Change password"}
            </button>
          </form>
        </div>
      </div>

      {me?.member_id && (
        <div className="two-col">
          <div className="card">
            <div className="section-head" style={{ marginTop: 0 }}><h2>My contributions</h2></div>
            {!myContributions ? (
              <Loading />
            ) : myContributions.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--slate)" }}>No contributions recorded yet.</p>
            ) : (
              <>
                {myContributions.slice(0, 6).map((c) => (
                  <div key={c.id} className="list-row">
                    <span style={{ fontSize: 12.5, color: "var(--slate)" }}>{new Date(c.contribution_date).toLocaleDateString("en-KE")}</span>
                    <strong className="amount pos">{fmt(c.amount)}</strong>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 8 }}>
                  Total: {fmt(myContributions.reduce((s, c) => s + Number(c.amount), 0))}
                </div>
              </>
            )}

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <Banner type="error">{payError}</Banner>
              <Banner type="success">{paySuccess}</Banner>
              <form onSubmit={handlePayContribution} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div className="field" style={{ marginBottom: 0, flex: 1 }}>
                  <label>Pay via M-Pesa (KSh)</label>
                  <input
                    type="number" min="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={defaultContribution ? String(defaultContribution) : "Amount"}
                  />
                </div>
                <button className="btn btn-gold" type="submit" disabled={paying}>
                  <SendIcon /> {paying ? "Sending…" : "Pay now"}
                </button>
              </form>
              <div className="hint" style={{ marginTop: 6 }}>
                Sends a payment prompt straight to your phone. Once you approve it, it's
                recorded automatically — no need to tell your treasurer.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-head" style={{ marginTop: 0 }}><h2>My loans</h2></div>
            {!myLoans ? (
              <Loading />
            ) : myLoans.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--slate)" }}>No loans on record yet.</p>
            ) : (
              myLoans.map((l) => (
                <div key={l.id} className="list-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{l.purpose || `Loan #${l.id}`}</div>
                    <div style={{ fontSize: 11.5, color: "var(--slate)" }}>{new Date(l.application_date).toLocaleDateString("en-KE")}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="amount">{fmt(l.amount)}</div>
                    <Stamp tone={l.status === "approved" ? "active" : l.status === "rejected" ? "rejected" : "pending"}>{l.status}</Stamp>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isAdmin && (
        <>
          <div className="section-head"><h2>Link a login to a member</h2></div>
          <div className="card">
            <Banner type="error">{linkError}</Banner>
            <form onSubmit={handleLink}>
              <div className="field-row">
                <div className="field">
                  <label>User account</label>
                  <select value={linkUserId} onChange={(e) => setLinkUserId(e.target.value)} required>
                    <option value="">Select…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role}){u.linked_member_name ? ` — linked to ${u.linked_member_name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Member record</label>
                  <select value={linkMemberId} onChange={(e) => setLinkMemberId(e.target.value)}>
                    <option value="">Unlink</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={linking || !linkUserId}>
                {linking ? "Saving…" : "Save link"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
