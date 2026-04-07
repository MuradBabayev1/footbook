const form = document.getElementById("loginForm");
const status = document.getElementById("status");
const API_BASE = "/api/auth";

const existingToken = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
const rawExistingUser = localStorage.getItem("footbook.user") || sessionStorage.getItem("footbook.user");
if (existingToken && rawExistingUser) {
    try {
        const existingUser = JSON.parse(rawExistingUser);
        if (String(existingUser.role || "").toUpperCase() === "ADMIN") {
            window.location.href = "admin-panel.html";
        }
    } catch (error) {
        // Ignore invalid session payload and continue on login page.
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.className = "status";

    const email = form.email.value.trim();
    const password = form.password.value;
    const remember = form.remember.checked;

    if (!email || !password) {
        status.textContent = "Please fill in email and password.";
        status.classList.add("error");
        return;
    }

    if (password.length < 6) {
        status.textContent = "Password must be at least 6 characters.";
        status.classList.add("error");
        return;
    }

    try {
        status.textContent = "Signing in...";

        const response = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            status.textContent = data.error || data.message || "Login failed. Please try again.";
            status.classList.add("error");
            return;
        }

        const role = String(data.role || "USER").toUpperCase();
        if (role !== "ADMIN") {
            localStorage.removeItem("footbook.token");
            localStorage.removeItem("footbook.user");
            sessionStorage.removeItem("footbook.token");
            sessionStorage.removeItem("footbook.user");
            status.textContent = "Admin account required for this panel.";
            status.classList.add("error");
            return;
        }

        const storage = remember ? localStorage : sessionStorage;
        const fallbackStorage = remember ? sessionStorage : localStorage;

        fallbackStorage.removeItem("footbook.token");
        fallbackStorage.removeItem("footbook.user");

        storage.setItem("footbook.token", data.token || "");
        storage.setItem("footbook.user", JSON.stringify({
            userId: data.userId,
            email: data.email,
            fullName: data.fullName,
            type: data.type || "Bearer",
            role
        }));

        status.textContent = "Login successful. Redirecting to admin panel...";
        status.classList.add("ok");

        window.setTimeout(() => {
            window.location.href = "admin-panel.html";
        }, 450);
    } catch (error) {
        status.textContent = "Unable to reach server. Check backend and try again.";
        status.classList.add("error");
    }
});
