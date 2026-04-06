const form = document.getElementById("userSignupForm");
const status = document.getElementById("status");
const API_BASE = "/api/auth";

const existingToken = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
if (existingToken) {
    window.location.href = "index.html";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.className = "status";

    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const phoneNumber = form.phoneNumber.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
        status.textContent = "Please fill in all fields.";
        status.classList.add("error");
        return;
    }

    if (password.length < 6) {
        status.textContent = "Password must be at least 6 characters.";
        status.classList.add("error");
        return;
    }

    if (!/^\d{9,15}$/.test(phoneNumber)) {
        status.textContent = "Phone number must be 9 to 15 digits.";
        status.classList.add("error");
        return;
    }

    if (password !== confirmPassword) {
        status.textContent = "Passwords do not match.";
        status.classList.add("error");
        return;
    }

    try {
        status.textContent = "Creating account...";

        const response = await fetch(`${API_BASE}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullName,
                email,
                phoneNumber,
                password
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            status.textContent = data.error || data.message || "Sign up failed. Please try again.";
            status.classList.add("error");
            return;
        }

        status.textContent = "Account created successfully. Redirecting to login...";
        status.classList.add("ok");

        window.setTimeout(() => {
            window.location.href = "user-login.html";
        }, 700);
    } catch (error) {
        status.textContent = "Unable to reach server. Please try again.";
        status.classList.add("error");
    }
});
