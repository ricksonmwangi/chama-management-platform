import { checkPasswordStrength } from "../utils/passwordStrength";

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const { score, label, tone, checks, meetsMinimum } = checkPasswordStrength(password);
  const segments = [0, 1, 2, 3];

  return (
    <div className="pw-strength">
      <div className="pw-strength-bar">
        {segments.map((i) => (
          <span key={i} className={`pw-strength-seg${i < score ? ` filled ${tone}` : ""}`} />
        ))}
      </div>
      <div className="pw-strength-row">
        <span className={`pw-strength-label ${tone}`}>{label}</span>
        {!meetsMinimum && (
          <span className="pw-strength-hint">
            Needs 8+ characters, a letter, and a number
          </span>
        )}
      </div>
      {password.length > 0 && !checks.hasSymbol && meetsMinimum && (
        <div className="pw-strength-tip">Tip: adding a symbol (like ! or #) makes this stronger.</div>
      )}
    </div>
  );
}
