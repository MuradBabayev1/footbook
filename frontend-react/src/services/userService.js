import { apiRequest } from "./apiClient";

const BASE = "/api/users";

export function getAllUsers() {
  return apiRequest(BASE);
}

export function deleteUser(userId) {
  return apiRequest(`${BASE}/${userId}`, { method: "DELETE" });
}
