import client from "./client";

export function login(username, password) {
  return client.post("/auth/login", { username, password }).then((r) => r.data);
}
export function register(username, email, password, captchaToken) {
  return client.post("/auth/register", { username, email, password, captchaToken }).then((r) => r.data);
}
export function getMe() {
  return client.get("/auth/me").then((r) => r.data);
}
export function linkMember(user_id, member_id) {
  return client.put("/auth/link-member", { user_id, member_id }).then((r) => r.data);
}
export function getAllUsers() {
  return client.get("/auth/users").then((r) => r.data);
}
export function changePassword(current_password, new_password) {
  return client.put("/auth/change-password", { current_password, new_password }).then((r) => r.data);
}
