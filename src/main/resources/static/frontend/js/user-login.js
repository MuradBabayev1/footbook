const form = document.getElementById("userLoginForm");
const status = document.getElementById("status");
const API_BASE = "/api/auth";

const existingToken = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
if (existingToken) {
    window.location.href = "user-dashboard.html";
}

function showVerificationResultFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");

    if (!verified) {
        return false;
    }

    status.className = "status";
    if (verified === "success") {
        status.textContent = "Email verified. You can now log in.";
        status.classList.add("ok");
    } else {
        status.textContent = "Invalid or expired verification link.";
        status.classList.add("error");
    }

    return true;
}

async function processVerificationToken() {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verifyToken") || params.get("code");
    if (!verifyToken) {
        return;
    }

    try {
        status.className = "status";
        status.textContent = "Verifying your email...";
            const response = await fetch(`${API_BASE}/verify-email?code=${encodeURIComponent(verifyToken)}`, {
                headers: {
                    "Accept": "application/json"
                }
            });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            status.textContent = data.error || "Verification failed. The link may be expired.";
            status.classList.add("error");
        } else {
            status.textContent = data.message || "Email verified. You can now log in.";
            status.classList.add("ok");
        }
    } catch (error) {
        status.textContent = "Unable to verify email right now. Please try again.";
        status.classList.add("error");
    }
}

showVerificationResultFromQuery();
processVerificationToken();

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
        const role = String(data.role || "USER").toUpperCase();

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
