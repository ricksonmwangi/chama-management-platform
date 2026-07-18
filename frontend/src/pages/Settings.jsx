import { useEffect, useState } from "react";
import * as settingsApi from "../api/settings";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Loading, Banner, RestrictedNotice } from "../components/ui";

const FREQUENCIES = ["weekly", "biweekly", "monthly"];

export default function Settings() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    settingsApi.getSettings()
      .then((data) => { setSettings(data); setForm(data); })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setNeedsSetup(true);
        } else {
          setError(apiErrorMessage(err, "Couldn't load settings."));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    setSuccess("");
    setSaving(true);
    try {
      await settingsApi.updateSettings(form);
      setSettings(form);
      setSuccess("Settings saved.");
    } catch (err) {
      setSaveError(apiErrorMessage(err, "Couldn't save settings."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Loading settings…" />;

  if (needsSetup) {
    return (
      <div className="banner banner-error">
        Settings haven't been initialised yet. Run{" "}
        <code>backend/database/patch2_auth_link_and_settings.sql</code> against your
        database, then reload this page.
      </div>
    );
  }

  if (error) return <Banner type="error">{error}</Banner>;
  if (!settings) return null;

  return (
    <div>
      <div className="card">
        <div className="section-head" style={{ marginTop: 0 }}><h2>Chama profile</h2></div>
        <div className="field">
          <label>Chama name</label>
          <input
            value={form.chama_name}
            disabled={!isAdmin}
            onChange={(e) => setForm({ ...form, chama_name: e.target.value })}
          />
        </div>

        <div className="weave" style={{ margin: "18px 0" }} />

        <div className="section-head" style={{ marginTop: 0 }}><h2>Contribution &amp; loan policy</h2></div>
        <div className="field-row">
          <div className="field">
            <label>Monthly contribution (KSh)</label>
            <input
              type="number" min="1" disabled={!isAdmin}
              value={form.monthly_contribution}
              onChange={(e) => setForm({ ...form, monthly_contribution: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Grace period (days)</label>
            <input
              type="number" min="0" disabled={!isAdmin}
              value={form.grace_period_days}
              onChange={(e) => setForm({ ...form, grace_period_days: e.target.value })}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Loan interest rate (% p.a.)</label>
            <input
              type="number" min="0" step="0.1" disabled={!isAdmin}
              value={form.loan_interest_rate}
              onChange={(e) => setForm({ ...form, loan_interest_rate: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Loan eligibility multiplier</label>
            <input
              type="number" min="0.1" step="0.1" disabled={!isAdmin}
              value={form.loan_multiplier}
              onChange={(e) => setForm({ ...form, loan_multiplier: e.target.value })}
            />
            <div className="hint">Members can borrow up to this × their total contributions. Applied live by the backend.</div>
          </div>
        </div>
        <div className="field">
          <label>Meeting frequency</label>
          <select
            disabled={!isAdmin}
            value={form.meeting_frequency}
            onChange={(e) => setForm({ ...form, meeting_frequency: e.target.value })}
          >
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {isAdmin ? (
          <>
            <Banner type="error">{saveError}</Banner>
            <Banner type="success">{success}</Banner>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setForm(settings)} disabled={saving}>Discard</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </>
        ) : (
          <RestrictedNotice what="editing these settings" />
        )}
      </div>
    </div>
  );
}
