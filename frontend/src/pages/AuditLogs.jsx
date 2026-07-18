import { useEffect, useState } from "react";
import * as auditApi from "../api/audit";
import { apiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Loading, Banner, RestrictedNotice, EmptyState } from "../components/ui";
import { ShieldIcon } from "../components/Icons";

export default function AuditLogs() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    auditApi.getAuditLogs(page, 25)
      .then(setData)
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load audit logs.")))
      .finally(() => setLoading(false));
  }, [isAdmin, page]);

  if (!isAdmin) return <RestrictedNotice what="audit logs" />;

  return (
    <div>
      <Banner type="error">{error}</Banner>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <Loading />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={<ShieldIcon style={{ width: 32, height: 32 }} />} title="No audit events yet" />
        ) : (
          <div style={{ padding: "4px 16px" }}>
            {data.data.map((log) => (
              <div key={log.id} className="list-row" style={{ alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{log.action}</div>
                  <div style={{ fontSize: 11.5, color: "var(--slate)", marginTop: 2 }}>User #{log.user_id}</div>
                </div>
                <div className="mono" style={{ fontSize: 11.5, color: "var(--slate)", whiteSpace: "nowrap" }}>
                  {new Date(log.created_at).toLocaleString("en-KE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.total_pages > 1 && (
          <div className="table-foot">
            <span>Page {data.current_page} of {data.total_pages} &middot; {data.total_records} events</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="btn btn-ghost btn-sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
