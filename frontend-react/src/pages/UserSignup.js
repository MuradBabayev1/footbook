import React, { useEffect, useState } from "react";
import "../styles/user-signup.css";

const API_BASE = "/api/auth";
const loginPath = "/user-login";
const legacyHomePath = "/frontend/index.html";

function UserSignup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState("USER");
  const [status, setStatus] = useState({ message: "", type: "" });

  useEffect(() => {
    document.title = "Footbook | User Sign Up";

    const existingToken =
      localStorage.getItem("footbook.token") ||
      sessionStorage.getItem("footbook.token");
    if (existingToken) {
      window.location.href = legacyHomePath;
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ message: "", type: "" });

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      setStatus({ message: "Please fill in all fields.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setStatus({ message: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    if (!/^\d{9,15}$/.test(phoneNumber)) {
      setStatus({ message: "Phone number must be 9 to 15 digits.", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ message: "Passwords do not match.", type: "error" });
      return;
    }

    try {
      setStatus({ message: "Creating account...", type: "" });

      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          password,
          accountType
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus({
          message: data.error || data.message || "Sign up failed. Please try again.",
          type: "error"
        });
        return;
      }

      const role = String(data.role || accountType || "USER").toUpperCase();
      const roleLabel = role === "OWNER" ? "Owner" : "User";
      setStatus({
        message: `${data.message || "Account created successfully."} Account type: ${roleLabel}.`,
        type: "ok"
      });

      window.setTimeout(() => {
        window.location.href = loginPath;
      }, 1200);
    } catch (error) {
      setStatus({ message: "Unable to reach server. Please try again.", type: "error" });
    }
  };

  return (
    <main className="auth-layout">
      <section className="story-pane">
        <p className="eyebrow">Create Your Footbook ID</p>
        <h1>Build your player profile in under a minute.</h1>
        <p className="lead">
          Set up once, then book stadiums, organize match plans, and keep your game life
          in sync from any device.
        </p>

        <div className="feature-grid">
          <article>
            <h3>Smart Scheduling</h3>
            <p>Reserve slots by date and time without calling anyone.</p>
          </article>
          <article>
            <h3>Secure Access</h3>
            <p>Your account keeps booking history and profile details protected.</p>
          </article>
          <article>
            <h3>Quick Updates</h3>
            <p>View and manage every booking from your dashboard instantly.</p>
          </article>
        </div>
      </section>

      <section className="form-pane" aria-label="User signup form">
        <div className="form-head">
          <span className="tag">New account</span>
          <h2>User Sign Up</h2>
          <p>Fill in your details to create your Footbook player account.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Your full name"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="player@footbook.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="01700123456"
                required
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="accountType">Account Type</label>
            <select
              id="accountType"
              name="accountType"
              value={accountType}
              onChange={(event) => setAccountType(event.target.value)}
            >
              <option value="USER">Player User</option>
              <option value="OWNER">Stadium Owner</option>
            </select>
          </div>

          <button type="submit" className="btn">Create Account</button>
          <div className={`status ${status.type || ""}`} aria-live="polite">
            {status.message}
          </div>
        </form>

        <p className="meta-links">
          Already have an account? <a href={loginPath}>Login</a>
        </p>
      </section>
    </main>
  );
}

export default UserSignup;
