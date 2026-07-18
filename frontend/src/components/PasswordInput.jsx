import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./Icons";

export default function PasswordInput({ id, value, onChange, required, autoComplete, placeholder, minLength }) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
