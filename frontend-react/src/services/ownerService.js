import { apiRequest } from "./apiClient";

export function promoteUserToOwner(userId) {
  return apiRequest(`/api/owners/promote/${userId}`, {
    method: "POST"
  });
}
