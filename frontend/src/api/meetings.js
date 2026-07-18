import client from "./client";

export function getMeetings() {
  return client.get("/meetings").then((r) => r.data);
}
export function getMeeting(id) {
  return client.get(`/meetings/${id}`).then((r) => r.data);
}
export function createMeeting(payload) {
  return client.post("/meetings", payload).then((r) => r.data);
}
export function updateMeeting(id, payload) {
  return client.put(`/meetings/${id}`, payload).then((r) => r.data);
}
export function deleteMeeting(id) {
  return client.delete(`/meetings/${id}`).then((r) => r.data);
}
export function setMyRsvp(meetingId, rsvp) {
  return client.put(`/meetings/${meetingId}/rsvp`, { rsvp }).then((r) => r.data);
}
export function getMeetingAttendance(meetingId) {
  return client.get(`/meetings/${meetingId}/attendance`).then((r) => r.data);
}
export function markAttendance(meetingId, member_id, attended) {
  return client.put(`/meetings/${meetingId}/attendance`, { member_id, attended }).then((r) => r.data);
}
