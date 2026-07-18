// Scored 0-5 based on length and character variety. Mirrors the backend's
// minimum requirement (authController.js) so the UI never promises
// something the API will then reject.
export function checkPasswordStrength(password) {
  const checks = {
    length8: password.length >= 8,
    length12: password.length >= 12,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  let score = 0;
  if (checks.length8) score++;
  if (checks.hasLower && checks.hasUpper) score++;
  if (checks.hasNumber) score++;
  if (checks.hasSymbol) score++;
  if (checks.length12) score++;

  // The actual floor the backend enforces: 8+ chars, at least one letter,
  // at least one number. Anything short of this, the API will 400 on.
  const meetsMinimum = checks.length8 && checks.hasNumber && (checks.hasLower || checks.hasUpper);

  let label = "";
  let tone = "";
  if (password.length > 0) {
    if (score <= 1) { label = "Weak"; tone = "weak"; }
    else if (score === 2) { label = "Fair"; tone = "fair"; }
    else if (score === 3) { label = "Good"; tone = "good"; }
    else { label = "Strong"; tone = "strong"; }
  }

  return { score, label, tone, checks, meetsMinimum };
}
