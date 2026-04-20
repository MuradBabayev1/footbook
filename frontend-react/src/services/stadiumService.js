import { apiRequest } from "./apiClient";

const BASE = "/api/stadiums";

export function getAllStadiums() {
  return apiRequest(BASE);
}

export function getStadiumById(stadiumId) {
  return apiRequest(`${BASE}/${stadiumId}`);
}

export function uploadStadiumPicture(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  return fetch(`${BASE}/upload-picture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  }).then(response => {
    return response.json().then(data => ({
      ok: response.ok,
      status: response.status,
      data: data
    }));
  });
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
