export function getAuthToken() {
  return (
    localStorage.getItem("footbook.token") ||
    sessionStorage.getItem("footbook.token")
  );
}

export function readStoredUser() {
  const rawUser =
    localStorage.getItem("footbook.user") ||
    sessionStorage.getItem("footbook.user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    return null;
  }
}

export function clearStoredSession() {
  localStorage.removeItem("footbook.token");
  localStorage.removeItem("footbook.user");
  sessionStorage.removeItem("footbook.token");
  sessionStorage.removeItem("footbook.user");
}
