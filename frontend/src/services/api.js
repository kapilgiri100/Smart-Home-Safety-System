import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_URL;
const fallbackBaseUrl = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}`
  : "http://localhost:5000";
const normalizedBaseUrl = (configuredBaseUrl || fallbackBaseUrl)
  .replace(/\/+$/, "")
  .endsWith("/api")
  ? (configuredBaseUrl || fallbackBaseUrl).replace(/\/+$/, "")
  : `${(configuredBaseUrl || fallbackBaseUrl).replace(/\/+$/, "")}/api`;

const api = axios.create({
  baseURL: normalizedBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
