const form = document.getElementById("userLoginForm");
const status = document.getElementById("status");
const API_BASE = "/api/auth";

const existingToken = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
if (existingToken) {
    window.location.href = "user-dashboard.html";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.className = "status";

    const email = form.email.value.trim();
    const password = form.password.value;
    const remember = form.remember.checked;

    if (!email || !password) {
        status.textContent = "Please enter your email and password.";
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

        const storage = remember ? localStorage : sessionStorage;
        const fallbackStorage = remember ? sessionStorage : localStorage;

        fallbackStorage.removeItem("footbook.token");
        fallbackStorage.removeItem("footbook.user");

        storage.setItem("footbook.token", data.token || "");
        storage.setItem("footbook.user", JSON.stringify({
            userId: data.userId,
            email: data.email,
            fullName: data.fullName,
            type: data.type || "Bearer"
        }));

        status.textContent = "Login successful. Redirecting...";
        status.classList.add("ok");

        window.setTimeout(() => {
            window.location.href = "user-dashboard.html";
        }, 400);
    } catch (error) {
        status.textContent = "Server unreachable. Please try again.";
        status.classList.add("error");
    }
});
