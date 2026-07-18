import client from "./client";

export function getRepayments() {
  return client.get("/repayments").then((r) => r.data);
}
export function getLoanRepayments(loanId) {
  return client.get(`/repayments/loan/${loanId}`).then((r) => r.data);
}
export function recordRepayment(payload) {
  return client.post("/repayments", payload).then((r) => r.data);
}
