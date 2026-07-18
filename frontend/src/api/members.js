import client from "./client";

export function getMembers() {
  return client.get("/members").then((r) => r.data);
}
export function getMember(id) {
  return client.get(`/members/${id}`).then((r) => r.data);
}
export function createMember(payload) {
  return client.post("/members", payload).then((r) => r.data);
}
export function updateMember(id, payload) {
  return client.put(`/members/${id}`, payload).then((r) => r.data);
}
export function deleteMember(id) {
  return client.delete(`/members/${id}`).then((r) => r.data);
}
