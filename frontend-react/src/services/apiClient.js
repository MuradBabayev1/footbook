import { getAuthToken } from "./session";

async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => "");
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = true, headers = {} } = options;

  const requestHeaders = { ...headers };
  if (auth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let requestBody = body;
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
    requestBody = requestHeaders["Content-Type"].includes("application/json")
      ? JSON.stringify(body)
      : body;
  }

  const response = await fetch(path, {
    method,
    headers: requestHeaders,
    body: requestBody
  });

  const data = await parseResponseBody(response);
  return {
    ok: response.ok,
    status: response.status,
    data
  };
}
