import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("genje_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("genje_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;

export function apiErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message === "Network Error") return "Can't reach the server. Is the backend running?";
  return fallback;
}
