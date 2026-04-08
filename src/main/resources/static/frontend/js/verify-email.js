const status = document.getElementById("verificationStatus");
const emailInput = document.getElementById("email");
const verificationCodeInput = document.getElementById("verificationCode");
const verifyButton = document.getElementById("verifyButton");
const resendButton = document.getElementById("resendButton");
const API_BASE = "/api/auth";

function setStatus(message, type = "") {
    status.textContent = message;
    status.className = "status";
    if (type) {
        status.classList.add(type);
    }
}

function prefillFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const code = params.get("code") || params.get("verifyToken");

    if (emailInput && email) {
        emailInput.value = email;
    }

    if (verificationCodeInput && code) {
        verificationCodeInput.value = code;
    }
}

async function verifyEmail() {
    const params = new URLSearchParams(window.location.search);
    const token = (verificationCodeInput?.value || params.get("code") || params.get("verifyToken") || "").trim();

    if (!token) {
        setStatus("Enter the 6-digit code from your email.", "error");
        return;
    }

    if (verificationCodeInput) {
        verificationCodeInput.value = token;
    }

    if (!/^[0-9]{6}$/.test(token)) {
        setStatus("Enter a valid 6-digit code.", "error");
        return;
    }

    try {
        setStatus("Verifying your email...");
        const response = await fetch(`${API_BASE}/verify-email?code=${encodeURIComponent(token)}`, {
            headers: {
                Accept: "application/json"
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            setStatus(data.error || "Verification failed. The link may be expired.", "error");
            return;
        }

        setStatus(data.message || "Email verified successfully.", "ok");
        window.setTimeout(() => {
            window.location.href = "user-login.html?verified=success";
        }, 900);
    } catch (error) {
        setStatus("Unable to verify email right now. Please try again.", "error");
    }
}

async function resendCode() {
    const email = (emailInput?.value || "").trim();
    if (!email) {
        setStatus("Enter your email to resend the code.", "error");
        return;
    }

    try {
        setStatus("Sending a new code...");
        const response = await fetch(`${API_BASE}/resend-verification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            setStatus(data.error || "Unable to resend code.", "error");
            return;
        }

        if (data.verificationCode && verificationCodeInput) {
            verificationCodeInput.value = data.verificationCode;
        }

        setStatus(data.message || "Verification code resent.", "ok");
    } catch (error) {
        setStatus("Unable to resend code right now. Please try again.", "error");
    }
}

prefillFromQuery();
verifyEmail();

if (verifyButton) {
    verifyButton.addEventListener("click", verifyEmail);
}

if (resendButton) {
    resendButton.addEventListener("click", resendCode);
}
