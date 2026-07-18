// src/pages/Login.jsx
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";
import { Banner } from "../components/ui";
import PasswordInput from "../components/PasswordInput";
import Recaptcha from "../components/Recaptcha"; // 👈 ADD THIS

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaRef = useRef(null); // 👈 ADD THIS
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState(""); // 👈 ADD THIS
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // 👇 ADD THIS: Check if reCAPTCHA is completed
    if (!captchaToken) {
      setError("Please complete the CAPTCHA before submitting.");
      return;
    }

    setLoading(true);
    try {
      // 👇 UPDATED: Pass captchaToken to login
      await login(username.trim(), password, captchaToken);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Login failed. Check your username and password."));
      // Reset reCAPTCHA on error
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
          <div className="name">Genje Group</div>
          <div className="tag">Chama Ledger</div>
        </div>
        <div className="weave" style={{ margin: "16px 0" }} />

        <Banner type="error">{error}</Banner>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input 
              id="username" 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              autoComplete="username" 
              required 
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordInput 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              autoComplete="current-password" 
              required 
            />
          </div>

          {/* 👇 ADD reCAPTCHA HERE */}
          <div className="field">
            <Recaptcha 
              ref={recaptchaRef} 
              onVerify={setCaptchaToken} 
              onExpire={() => setCaptchaToken("")} 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            disabled={loading || !captchaToken} // 👈 UPDATED: Disable if no captcha
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="login-foot-note">
          New here? Ask your chama's admin to add you, or{" "}
          <a onClick={() => navigate("/register")}>register an account</a>.
        </div>
      </div>
    </div>
  );
}