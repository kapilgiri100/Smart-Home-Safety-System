import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, "").endsWith("/api")
  ? configuredBaseUrl.replace(/\/+$/, "")
  : `${configuredBaseUrl.replace(/\/+$/, "")}/api`;

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
