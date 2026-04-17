import { apiRequest } from "./apiClient";

const BASE = "/api/bookings";

export function getAllBookings() {
  return apiRequest(BASE);
}

export function approveBooking(bookingId) {
  return apiRequest(`${BASE}/${bookingId}/status`, {
    method: "PATCH",
    body: { status: "CONFIRMED" }
  });
}

export function createBooking(payload) {
  return apiRequest(BASE, { method: "POST", body: payload });
}
