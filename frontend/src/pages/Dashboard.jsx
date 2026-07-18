import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../api/dashboard";
import { getMyContributions } from "../api/contributions";
import { getMyLoans } from "../api/loans";
import { getMeetings } from "../api/meetings";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { StatCard, Loading, Banner, Stamp } from "../components/ui";
import { CalendarIcon, TrendingIcon } from "../components/Icons";

function fmt(n) {
  return "KSh " + Number(n || 0).toLocaleString("en-KE");
}

export default function Dashboard() {
  const { user, me, isAdmin, memberRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboardStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => { if (!cancelled) setError(apiErrorMessage(err, "Couldn't load dashboard stats.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loading label="Loading dashboard…" />;
  if (error) return <Banner type="error">{error}</Banner>;
  if (!stats) return null;

  // Three distinct dashboard experiences:
  // 1. Admin login role, or a member whose chama role is treasurer -> full
  //    financial control panel (they're the ones actually moving money).
  // 2. Chairperson / secretary / committee -> governance-focused view:
  //    meetings and membership, plus the same org-wide numbers, read-only.
  // 3. Everyone else (plain member, or not linked to a roster entry yet)
  //    -> a personal view: their own contributions/loans, not the whole
  //    chama's books.
  if (isAdmin || memberRole === "treasurer") {
    return <FinancialDashboard stats={stats} isAdmin={isAdmin} />;
  }
  if (["chairperson", "secretary", "committee"].includes(memberRole)) {
    return <LeadershipDashboard stats={stats} me={me} />;
  }
  return <PersonalDashboard stats={stats} me={me} />;
}

// ============================= 1. FINANCIAL (admin / treasurer) =============================
function FinancialDashboard({ stats, isAdmin }) {
  const navigate = useNavigate();
  return (
    <div>
      {!isAdmin && (
        <div className="banner" style={{ background: "var(--gold-tint)", color: "#7a5a26" }}>
          You're marked as Treasurer, but your login role is "member" — you can see the full
          picture below, but recording money still needs an admin-role login. Ask your chama's
          admin if you need that upgraded.
        </div>
      )}
      <div className="stat-grid">
        <StatCard hero label="Loan Fund Outstanding" value={fmt(stats.outstanding_loans)} delta={`${stats.approved_loans} approved loans active`} />
        <StatCard label="Total Members" value={stats.total_members} />
        <StatCard label="Total Contributions" value={fmt(stats.total_contributions)} delta="All-time, all members" />
        <StatCard label="Total Loans Issued" value={stats.total_loans} delta={fmt(stats.total_loan_amount) + " disbursed"} />
        <StatCard label="Pending Loan Applications" value={stats.pending_loans} />
        <StatCard label="Rejected Loans" value={stats.rejected_loans} />
        <StatCard label="Total Repayments" value={fmt(stats.total_repayments)} delta="Received against all loans" />
      </div>

      <div className="section-head"><h2>Quick actions</h2></div>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <button className="card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => navigate("/contributions")}>
          <div className="page-eyebrow">Money in</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Record a contribution</div>
        </button>
        <button className="card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => navigate("/loans")}>
          <div className="page-eyebrow">{stats.pending_loans} waiting</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Review loan applications</div>
        </button>
        <button className="card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => navigate("/mpesa")}>
          <div className="page-eyebrow">M-Pesa</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Send a payment request</div>
        </button>
      </div>
    </div>
  );
}

// ============================= 2. LEADERSHIP (chair / secretary / committee) =============================
function LeadershipDashboard({ stats, me }) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState(null);

  useEffect(() => {
    getMeetings().then(setMeetings).catch(() => setMeetings([]));
  }, []);

  const nextMeeting = (meetings || [])
    .filter((m) => new Date(m.meeting_date) >= new Date())
    .sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date))[0];

  return (
    <div>
      <div className="banner" style={{ background: "var(--forest-tint)", color: "var(--forest-deep)" }}>
        Signed in as <strong style={{ textTransform: "capitalize" }}>{me?.member_role}</strong> — here's the
        governance view: meetings and membership up front, full chama numbers below.
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-head" style={{ marginTop: 0 }}><h2>Next meeting</h2></div>
          {meetings === null ? (
            <Loading />
          ) : nextMeeting ? (
            <>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600 }}>{nextMeeting.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--slate)", marginTop: 4 }}>
                {new Date(nextMeeting.meeting_date).toLocaleDateString("en-KE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                {" · "}{nextMeeting.location}
              </div>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={() => navigate("/meetings")}>
                <CalendarIcon /> Manage meetings &amp; attendance
              </button>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "var(--slate)" }}>No upcoming meetings scheduled.</p>
          )}
        </div>

        <div className="card">
          <div className="section-head" style={{ marginTop: 0 }}><h2>Membership</h2></div>
          <div className="list-row"><span>Total members</span><strong>{stats.total_members}</strong></div>
          <div className="list-row"><span>Pending loan applications</span><strong>{stats.pending_loans}</strong></div>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => navigate("/members")}>
            View member registry
          </button>
        </div>
      </div>

      <div className="section-head"><h2>Chama financial snapshot</h2></div>
      <div className="stat-grid">
        <StatCard hero label="Loan Fund Outstanding" value={fmt(stats.outstanding_loans)} />
        <StatCard label="Total Contributions" value={fmt(stats.total_contributions)} />
        <StatCard label="Total Loans Issued" value={stats.total_loans} />
        <StatCard label="Total Repayments" value={fmt(stats.total_repayments)} />
      </div>
    </div>
  );
}

// ============================= 3. PERSONAL (plain member / unlinked) =============================
function PersonalDashboard({ stats, me }) {
  const navigate = useNavigate();
  const [contributions, setContributions] = useState(null);
  const [loans, setLoans] = useState(null);
  const [meetings, setMeetings] = useState(null);
  const linked = !!me?.member_id;

  useEffect(() => {
    if (!linked) return;
    getMyContributions().then(setContributions).catch(() => setContributions([]));
    getMyLoans().then(setLoans).catch(() => setLoans([]));
  }, [linked]);

  useEffect(() => {
    getMeetings().then(setMeetings).catch(() => setMeetings([]));
  }, []);

  const myTotal = (contributions || []).reduce((s, c) => s + Number(c.amount), 0);
  const activeLoan = (loans || []).find((l) => l.status === "approved");
  const nextMeeting = (meetings || [])
    .filter((m) => new Date(m.meeting_date) >= new Date())
    .sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date))[0];

  return (
    <div>
      {!linked && (
        <div className="banner" style={{ background: "var(--gold-tint)", color: "#7a5a26" }}>
          Your login isn't linked to a member record yet, so we can't show your personal
          contributions or loans here — just the chama's overall numbers. Ask an admin to link
          your account from the Profile page.
        </div>
      )}

      <div className="stat-grid">
        <StatCard hero label="Chama Pot — Total Contributed" value={fmt(stats.total_contributions)} delta={`${stats.total_members} members`} />
        {linked && <StatCard label="My Total Contributed" value={fmt(myTotal)} />}
        {linked && (
          <StatCard
            label="My Loan Status"
            value={activeLoan ? fmt(activeLoan.amount) : "None active"}
            delta={activeLoan ? "Approved" : undefined}
          />
        )}
        <StatCard label="Loan Fund Available" value={fmt(stats.total_loan_amount - stats.outstanding_loans)} delta="Approximate, chama-wide" />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-head" style={{ marginTop: 0 }}><h2><TrendingIcon style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 5 }} />My contributions</h2></div>
          {!linked ? (
            <p style={{ fontSize: 13, color: "var(--slate)" }}>Not linked to a member record yet.</p>
          ) : contributions === null ? (
            <Loading />
          ) : contributions.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--slate)" }}>No contributions recorded yet.</p>
          ) : (
            contributions.slice(0, 5).map((c) => (
              <div key={c.id} className="list-row">
                <span style={{ fontSize: 12.5, color: "var(--slate)" }}>{new Date(c.contribution_date).toLocaleDateString("en-KE")}</span>
                <strong className="amount pos">{fmt(c.amount)}</strong>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="section-head" style={{ marginTop: 0 }}><h2><CalendarIcon style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 5 }} />Next meeting</h2></div>
          {meetings === null ? (
            <Loading />
          ) : nextMeeting ? (
            <>
              <div style={{ fontWeight: 600 }}>{nextMeeting.title}</div>
              <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 4 }}>
                {new Date(nextMeeting.meeting_date).toLocaleDateString("en-KE", { weekday: "short", day: "2-digit", month: "short" })} · {nextMeeting.location}
              </div>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={() => navigate("/meetings")}>
                RSVP &amp; view agenda
              </button>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "var(--slate)" }}>No upcoming meetings scheduled.</p>
          )}
        </div>
      </div>

      {linked && activeLoan && (
        <>
          <div className="section-head"><h2>My active loan</h2></div>
          <div className="card">
            <div className="list-row">
              <div>
                <div style={{ fontWeight: 600 }}>{activeLoan.purpose || `Loan #${activeLoan.id}`}</div>
                <div style={{ fontSize: 11.5, color: "var(--slate)" }}>Applied {new Date(activeLoan.application_date).toLocaleDateString("en-KE")}</div>
              </div>
              <Stamp tone="active">{activeLoan.status}</Stamp>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
