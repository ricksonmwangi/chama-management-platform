import client from "./client";

export function stkPush(phone, amount) {
  return client.post("/mpesa/stkpush", { phone, amount }).then((r) => r.data);
}
export function getTransactions() {
  return client.get("/mpesa/transactions").then((r) => r.data);
}
// Self-service — pays the logged-in user's own contribution. amount is
// optional; the backend falls back to the chama's configured monthly
// contribution if omitted.
export function payMyContribution(amount) {
  return client.post("/mpesa/pay-contribution", amount ? { amount } : {}).then((r) => r.data);
}
export function normalizeKenyanPhone(input) {
  const digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}
