import api from "./api";

export async function fetchSchedules() {
  const { data } = await api.get("/schedules");
  return data;
}

export async function createSchedule(payload) {
  const { data } = await api.post("/schedules", payload);
  return data;
}

export async function updateSchedule(id, payload) {
  const { data } = await api.put(`/schedules/${id}`, payload);
  return data;
}

export async function deleteSchedule(id) {
  const { data } = await api.delete(`/schedules/${id}`);
  return data;
}

export async function setScheduleEnabled(id, enabled) {
  return updateSchedule(id, { enabled });
}

