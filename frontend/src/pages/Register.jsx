import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";
import { apiErrorMessage } from "../api/client";
import { Banner } from "../components/ui";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import PasswordInput from "../components/PasswordInput";
import Recaptcha from "../components/Recaptcha";
import { checkPasswordStrength } from "../utils/passwordStrength";

export default function Register() {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { meetsMinimum } = checkPasswordStrength(password);
  const passwordsMatch = confirm.length === 0 || password === confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!meetsMinimum) {
      setError("Password needs at least 8 characters, including a letter and a number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!captchaToken) {
      setError("Please complete the CAPTCHA before submitting.");
      return;
    }

    setLoading(true);
    try {
      await authApi.register(username.trim(), email.trim(), password, captchaToken);
      setSuccess("Account created. You can sign in now.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(apiErrorMessage(err, "Registration failed."));
      // A CAPTCHA token can only be used once — reset the widget so they
      // can verify again before retrying.
      recaptchaRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="mark">GG</div>
          <div className="name">Create account</div>
          <div className="tag">New accounts start with member-level access</div>
        </div>
        <div className="weave" style={{ margin: "16px 0" }} />

        <Banner type="error">{error}</Banner>
        <Banner type="success">{success}</Banner>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PasswordStrengthMeter password={password} />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <PasswordInput id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {!passwordsMatch && <div className="error">Passwords don't match yet.</div>}
          </div>
          <div className="field">
            <Recaptcha ref={recaptchaRef} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading || !meetsMinimum || !passwordsMatch || !captchaToken}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="login-foot-note">
          Already have an account? <a onClick={() => navigate("/login")}>Sign in</a>
        </div>
      </div>
    </div>
  );
}
