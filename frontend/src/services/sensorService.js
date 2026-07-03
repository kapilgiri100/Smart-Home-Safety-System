import api from "./api";

export async function fetchSensorStatus() {
  const { data } = await api.get("/sensors");
  return data;
}

export async function fetchActivity(limit = 50) {
  const { data } = await api.get(`/activity?limit=${limit}`);
  return data;
}
