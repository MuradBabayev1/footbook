import { apiRequest } from "./apiClient";

export function login(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: payload,
    auth: false
  });
}

export function register(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: payload,
    auth: false
  });
}

export function resendVerification(payload) {
  return apiRequest("/api/auth/resend-verification", {
    method: "POST",
    body: payload,
    auth: false
  });
}

export function verifyEmail(payload) {
  return apiRequest("/api/auth/verify-email", {
    method: "POST",
    body: payload,
    auth: false
  });
}
