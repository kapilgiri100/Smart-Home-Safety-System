import api from "./api";

export async function fetchAppliances() {
  const { data } = await api.get("/appliances");
  return data;
}

export async function updateAppliance(id, updates) {
  const { data } = await api.put(`/appliances/${id}`, updates);
  return data;
}

export async function setApplianceStatus(id, status) {
  return updateAppliance(id, { status });
}

export async function setApplianceName(id, name) {
  return updateAppliance(id, { name });
}
