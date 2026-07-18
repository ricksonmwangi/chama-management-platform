import client from "./client";

export function getAuditLogs(page = 1, limit = 25) {
  return client.get("/audit", { params: { page, limit } }).then((r) => r.data);
}
