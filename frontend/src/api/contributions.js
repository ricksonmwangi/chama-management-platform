import client from "./client";

export function getContributions() {
  return client.get("/contributions").then((r) => r.data);
}
export function createContribution(payload) {
  return client.post("/contributions", payload).then((r) => r.data);
}
export function getMemberContributions(memberId) {
  return client.get(`/contributions/member/${memberId}`).then((r) => r.data);
}
export function getMemberContributionSummary(memberId) {
  return client.get(`/contributions/member/${memberId}/summary`).then((r) => r.data);
}
export function getMyContributions() {
  return client.get("/contributions/me").then((r) => r.data);
}
