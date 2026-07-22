import { useState } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GridIcon, UsersIcon, CoinsIcon, NoteIcon, RepeatIcon, CalendarIcon,
  ShieldIcon, PhoneIcon, GearIcon, UserIcon, MenuIcon, BellIcon, LogoutIcon,
} from "./Icons";

// Single source of truth for what each role can even SEE in navigation —
// not just what happens if they click it. `show` mirrors the same
// permission logic the backend enforces (see AuthContext's canViewFinance
// etc.), so someone without access to a page never sees a link to it in
// the first place, on desktop or mobile.
const NAV_ALL = [
  { to: "/dashboard", label: "Dashboard", icon: GridIcon, show: () => true },
  { to: "/members", label: "Members", icon: UsersIcon, show: (p) => p.isAdmin },
  { to: "/contributions", label: "Contributions", icon: CoinsIcon, show: (p) => p.canViewFinance },
  { to: "/loans", label: "Loans", icon: NoteIcon, show: (p) => p.canViewFinance },
  { to: "/repayments", label: "Loan Repayments", icon: RepeatIcon, show: (p) => p.canViewFinance },
  { to: "/meetings", label: "Meetings", icon: CalendarIcon, show: () => true },
  { to: "/audit", label: "Audit Logs", icon: ShieldIcon, show: (p) => p.isAdmin },
  { to: "/mpesa", label: "M-Pesa Payments", icon: PhoneIcon, show: (p) => p.canManageFinance },
  { to: "/settings", label: "Settings", icon: GearIcon, show: () => true },
  { to: "/profile", label: "Profile", icon: UserIcon, show: () => true },
];

const TITLES = {
  "/dashboard": ["Overview", "Dashboard"],
  "/members": ["Registry", "Members"],
  "/contributions": ["Money in", "Contributions"],
  "/loans": ["Loan fund", "Loans"],
  "/repayments": ["Loan fund", "Loan Repayments"],
  "/meetings": ["Agenda & minutes", "Meetings"],
  "/audit": ["Accountability", "Audit Logs"],
  "/mpesa": ["Money in", "M-Pesa Payments"],
  "/settings": ["Chama configuration", "Settings"],
  "/profile": ["My account", "Profile"],
};

// If a role's visible nav fits in the bottom bar on its own, show it all
// directly — no "More" overflow at all. Only roles with more than this
// many pages (realistically just admin) get a "More" sheet.
const MAX_MAIN_TABS = 5;

export default function Layout() {
  const auth = useAuth();
  const { user, me, logout } = auth;
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const NAV = NAV_ALL.filter((item) => item.show(auth));

  const needsMore = NAV.length > MAX_MAIN_TABS;
  const TAB_MAIN = needsMore ? NAV.slice(0, MAX_MAIN_TABS - 1) : NAV;
  const TAB_MORE = needsMore ? NAV.slice(MAX_MAIN_TABS - 1) : [];

  const [eyebrow, title] = TITLES[location.pathname] || ["", "Genje Group"];
  const displayName = me?.full_name || (user?.role === "admin" ? "Administrator" : "Member");
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "GG";
  const roleLabel = me?.member_role || (user?.role === "admin" ? "admin" : "member");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="name">Genje Group</div>
          <div className="sub">Chama Ledger</div>
        </div>
        <div className="sidebar-weave" />
        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => "sidebar-nav-item" + (isActive ? " active" : "")}>
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">{initials}</div>
          <div className="who" style={{ flex: 1, minWidth: 0 }}>
            <div className="n">{displayName}</div>
            <div className="r" style={{ textTransform: "capitalize" }}>{roleLabel}</div>
          </div>
          <button onClick={handleLogout} title="Sign out"><LogoutIcon /></button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          {needsMore && (
            <button className="icon-btn mobile-only" onClick={() => setMoreOpen(true)} aria-label="Menu">
              <MenuIcon />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="page-eyebrow">{eyebrow}</div>
            <div className="page-title">{title}</div>
          </div>
          <button className="icon-btn" aria-label="Notifications"><BellIcon /></button>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-tabbar">
        {TAB_MAIN.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}>
            <Icon /> {label.split(" ")[0]}
          </NavLink>
        ))}
        {needsMore && (
          <button onClick={() => setMoreOpen(true)}>
            <MenuIcon /> More
          </button>
        )}
      </nav>

      {needsMore && (
        <div className={`more-sheet${moreOpen ? " shown" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setMoreOpen(false); }}>
          <div className="more-sheet-panel">
            <div className="more-sheet-handle" />
            <div className="more-sheet-grid">
              {TAB_MORE.map(({ to, label, icon: Icon }) => (
                <button key={to} className="more-sheet-tile" onClick={() => { navigate(to); setMoreOpen(false); }}>
                  <span className="more-sheet-tile-icon"><Icon /></span>
                  {label}
                </button>
              ))}
            </div>
            <button className="more-sheet-item more-sheet-signout" onClick={handleLogout}>
              <LogoutIcon /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
