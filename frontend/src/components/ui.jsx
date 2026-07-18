import { LockIcon } from "./Icons";

export function Stamp({ children, tone = "closed" }) {
  return <span className={`stamp ${tone}`}>{children}</span>;
}

export function StatCard({ label, value, delta, hero = false }) {
  return (
    <div className={`stat-card${hero ? " hero" : ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {delta ? <div className="delta">{delta}</div> : null}
    </div>
  );
}

export function EmptyState({ title, children, icon }) {
  return (
    <div className="empty-state">
      {icon}
      <div className="t">{title}</div>
      {children ? <div>{children}</div> : null}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return <div className="loading-row">{label}</div>;
}

export function Banner({ type = "error", children }) {
  if (!children) return null;
  return <div className={`banner banner-${type}`}>{children}</div>;
}

export function RestrictedNotice({ what = "this section" }) {
  return (
    <div className="card restricted-card">
      <LockIcon />
      <div className="t">Admins only</div>
      <p style={{ fontSize: 13, color: "var(--slate)", maxWidth: 360, margin: "0 auto" }}>
        Your account doesn't have admin access, so {what} isn't visible yet.
        Ask your chama's Treasurer or Secretary to grant you admin access if you need to manage this.
      </p>
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
