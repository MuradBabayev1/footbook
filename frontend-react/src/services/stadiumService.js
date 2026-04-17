import { apiRequest } from "./apiClient";

const BASE = "/api/stadiums";

export function getAllStadiums() {
  return apiRequest(BASE);
}

export function getStadiumById(stadiumId) {
  return apiRequest(`${BASE}/${stadiumId}`);
}

export function createStadium(payload) {
  return apiRequest(BASE, { method: "POST", body: payload });
}

export function updateStadium(stadiumId, payload) {
  return apiRequest(`${BASE}/${stadiumId}`, { method: "PUT", body: payload });
}

export function deleteStadium(stadiumId) {
  return apiRequest(`${BASE}/${stadiumId}`, { method: "DELETE" });
}
