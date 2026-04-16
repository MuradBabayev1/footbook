import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/user-login.css";

const API_BASE = "/api/auth";
const ownerDashboardPath = "/frontend/owner-dashboard.html";
const userDashboardPath = "/frontend/user-dashboard.html";

function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "" });

  useEffect(() => {
    document.title = "Footbook | User Login";

    const existingToken =
      localStorage.getItem("footbook.token") ||
      sessionStorage.getItem("footbook.token");
    const existingUserRaw =
      localStorage.getItem("footbook.user") ||
      sessionStorage.getItem("footbook.user");

    if (existingToken && existingUserRaw) {
      try {
        const existingUser = JSON.parse(existingUserRaw);
        const existingRole = String(existingUser.role || "USER").toUpperCase();
        window.location.href =
          existingRole === "OWNER" ? ownerDashboardPath : userDashboardPath;
      } catch (error) {
        window.location.href = userDashboardPath;
      }
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ message: "", type: "" });

    if (!email || !password) {
      setStatus({ message: "Please enter your email and password.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setStatus({ message: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    try {
      setStatus({ message: "Signing in...", type: "" });

      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus({
          message: data.error || data.message || "Login failed. Please try again.",
          type: "error"
        });
        return;
      }

      const storage = remember ? localStorage : sessionStorage;
      const fallbackStorage = remember ? sessionStorage : localStorage;
      const role = String(data.role || "USER").toUpperCase();

      fallbackStorage.removeItem("footbook.token");
      fallbackStorage.removeItem("footbook.user");

      storage.setItem("footbook.token", data.token || "");
      storage.setItem(
        "footbook.user",
        JSON.stringify({
          userId: data.userId ?? data.id,
          email: data.email,
          fullName: data.fullName,
          type: data.type || "Bearer",
          role
        })
      );

      setStatus({ message: "Login successful. Redirecting...", type: "ok" });

      window.setTimeout(() => {
        window.location.href = role === "OWNER" ? ownerDashboardPath : userDashboardPath;
      }, 400);
    } catch (error) {
      setStatus({ message: "Server unreachable. Please try again.", type: "error" });
    }
  };

  return (
    <main className="auth-layout">
      <section className="story-pane">
        <p className="eyebrow">Footbook Player Access</p>
        <h1>Welcome back to match mode.</h1>
        <p className="lead">
          Jump straight into stadium discovery, secure your preferred slot, and keep
          every booking in one sharp dashboard.
        </p>

        <div className="story-cards">
          <article>
            <h3>Instant Availability</h3>
            <p>Scan open stadiums and reserve before slots disappear.</p>
          </article>
          <article>
            <h3>Fast Booking Flow</h3>
            <p>Create and track matches in a clean, focused workflow.</p>
          </article>
          <article>
            <h3>One Account</h3>
            <p>Sign in once, then manage your full playing schedule.</p>
          </article>
        </div>
      </section>

      <section className="form-pane" aria-label="User login form">
        <div className="form-head">
          <span className="tag">Sign in</span>
          <h2>User Login</h2>
          <p>Use your registered email and password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="row">
            <label className="checkbox">
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Keep me signed in
            </label>
            <a href="#" className="link">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn">Login</button>
          <div className={`status ${status.type || ""}`} aria-live="polite">
            {status.message}
          </div>
        </form>

        <p className="meta-links">
          New user? <a href="/user-signup">Create account</a>
          <span className="divider">|</span>
          Are you admin? <a href="/frontend/login.html">Admin login</a>
        </p>
      </section>
    </main>
  );
}

export default UserLogin;
