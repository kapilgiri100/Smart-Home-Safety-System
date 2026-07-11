import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_URL;
// Ensure we always end with `/api` because backend mounts routes under `/api/*`.
const fallbackBaseUrl =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}`
    : "http://localhost:5000";

function normalizeApiBaseUrl(baseUrl) {
  const cleaned = (baseUrl || "").replace(/\/+$/, "");
  if (!cleaned) return "http://localhost:5000/api";

  // If the env already points to /api or /api/, keep it exactly.
  if (cleaned.endsWith("/api")) return cleaned;

  return `${cleaned}/api`;
}

// DEBUG (temporary): if this breaks your UI, revert.
// console.log("VITE_API_URL:", configuredBaseUrl, "base:", normalizedBaseUrl);

const normalizedBaseUrl = normalizeApiBaseUrl(configuredBaseUrl || fallbackBaseUrl);



const api = axios.create({
  baseURL: normalizedBaseUrl,
  // Helps diagnose backend 404s by printing the final requested URL.
  // (Axios doesn't expose request URL otherwise.)
  transformRequest: [
    (data, headers) => {
      return data;
    },
  ],
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
