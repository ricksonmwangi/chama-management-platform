import client from "./client";

export function getSettings() {
  return client.get("/settings").then((r) => r.data);
}
export function updateSettings(payload) {
  return client.put("/settings", payload).then((r) => r.data);
}
