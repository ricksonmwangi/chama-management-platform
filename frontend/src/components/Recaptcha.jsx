import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// The script is loaded once and shared across any number of Recaptcha
// instances on the page (there's realistically only ever one, on Register,
// but this avoids double-loading if that ever changes).
let scriptPromise = null;
function loadRecaptchaScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.grecaptcha && window.grecaptcha.render) {
      resolve(window.grecaptcha);
      return;
    }
    window.__onRecaptchaLoad = () => resolve(window.grecaptcha);
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit&onload=__onRecaptchaLoad";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA script."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Exposes a .reset() method via ref, since a completed token can only be
// used once — the parent form needs to reset the widget after any failed
// submit so the person can verify again.
const Recaptcha = forwardRef(function Recaptcha({ onVerify, onExpire }, ref) {
  const containerRef = useRef(null);
  const widgetId = useRef(null);
  const [error, setError] = useState("");

  useImperativeHandle(ref, () => ({
    reset() {
      if (window.grecaptcha && widgetId.current !== null) {
        window.grecaptcha.reset(widgetId.current);
      }
    }
  }));

  useEffect(() => {
    if (!SITE_KEY) {
      setError("reCAPTCHA isn't configured (missing site key).");
      return;
    }

    let cancelled = false;

    loadRecaptchaScript()
      .then((grecaptcha) => {
        if (cancelled || !containerRef.current || widgetId.current !== null) return;
        widgetId.current = grecaptcha.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: onVerify,
          "expired-callback": onExpire,
        });
      })
      .catch(() => setError("Couldn't load reCAPTCHA — check your connection."));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="error">{error}</div>;
  return <div ref={containerRef} />;
});

export default Recaptcha;
