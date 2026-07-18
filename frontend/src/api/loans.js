import client from "./client";

export function getLoans() {
  return client.get("/loans").then((r) => r.data);
}
export function applyLoan(payload) {
  return client.post("/loans", payload).then((r) => r.data);
}
export function approveLoan(id) {
  return client.put(`/loans/${id}/approve`).then((r) => r.data);
}
export function rejectLoan(id) {
  return client.put(`/loans/${id}/reject`).then((r) => r.data);
}
export function getLoanBalance(id) {
  return client.get(`/loans/${id}/balance`).then((r) => r.data);
}
export function getMyLoans() {
  return client.get("/loans/me").then((r) => r.data);
}
