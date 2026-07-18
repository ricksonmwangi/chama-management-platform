import { useState } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GridIcon, UsersIcon, CoinsIcon, NoteIcon, RepeatIcon, CalendarIcon,
  ShieldIcon, PhoneIcon, GearIcon, UserIcon, MenuIcon, BellIcon, LogoutIcon,
} from "./Icons";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: GridIcon },
  { to: "/members", label: "Members", icon: UsersIcon },
  { to: "/contributions", label: "Contributions", icon: CoinsIcon },
  { to: "/loans", label: "Loans", icon: NoteIcon },
  { to: "/repayments", label: "Loan Repayments", icon: RepeatIcon },
  { to: "/meetings", label: "Meetings", icon: CalendarIcon },
  { to: "/audit", label: "Audit Logs", icon: ShieldIcon },
  { to: "/mpesa", label: "M-Pesa Payments", icon: PhoneIcon },
  { to: "/settings", label: "Settings", icon: GearIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

const TAB_MAIN = NAV.slice(0, 4);
const TAB_MORE = NAV.slice(4);

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

export default function Layout() {
  const { user, me, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

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
          <button className="icon-btn mobile-only" onClick={() => setMoreOpen(true)} aria-label="Menu">
            <MenuIcon />
          </button>
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
        <button onClick={() => setMoreOpen(true)}>
          <MenuIcon /> More
        </button>
      </nav>

      <div className={`more-sheet${moreOpen ? " shown" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setMoreOpen(false); }}>
        <div className="more-sheet-panel">
          <div className="more-sheet-handle" />
          {TAB_MORE.map(({ to, label, icon: Icon }) => (
            <button key={to} className="more-sheet-item" onClick={() => { navigate(to); setMoreOpen(false); }}>
              <Icon /> {label}
            </button>
          ))}
          <button className="more-sheet-item" onClick={handleLogout}>
            <LogoutIcon /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
