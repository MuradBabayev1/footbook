import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin-login.css";

const API_BASE = "/api/auth";
const adminPanelPath = "/admin-panel";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "" });

  useEffect(() => {
    document.title = "Footbook | Login";

    const existingToken =
      localStorage.getItem("footbook.token") ||
      sessionStorage.getItem("footbook.token");
    const rawExistingUser =
      localStorage.getItem("footbook.user") ||
      sessionStorage.getItem("footbook.user");

    if (existingToken && rawExistingUser) {
      try {
        const existingUser = JSON.parse(rawExistingUser);
        if (String(existingUser.role || "").toUpperCase() === "ADMIN") {
          navigate(adminPanelPath, { replace: true });
        }
      } catch (error) {
        // Ignore invalid session payload and continue on login page.
      }
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ message: "", type: "" });

    if (!email || !password) {
      setStatus({ message: "Please fill in email and password.", type: "error" });
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

      const role = String(data.role || "USER").toUpperCase();
      if (role !== "ADMIN") {
        localStorage.removeItem("footbook.token");
        localStorage.removeItem("footbook.user");
        sessionStorage.removeItem("footbook.token");
        sessionStorage.removeItem("footbook.user");
        setStatus({ message: "Admin account required for this panel.", type: "error" });
        return;
      }

      const storage = remember ? localStorage : sessionStorage;
      const fallbackStorage = remember ? sessionStorage : localStorage;

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

      setStatus({ message: "Login successful. Redirecting to admin panel...", type: "ok" });

      window.setTimeout(() => {
        navigate(adminPanelPath);
      }, 450);
    } catch (error) {
      setStatus({
        message: "Unable to reach server. Check backend and try again.",
        type: "error"
      });
    }
  };

  return (
    <div className="shell">
      <section className="hero">
        <div className="eyebrow">
          <span className="dot"></span> Footbook Access
        </div>
        <h1>Welcome back to your booking command center.</h1>
        <p>
          Sign in to manage bookings, review stadium availability, and track daily
          operations in one place.
        </p>
        <ul>
          <li>Fast admin and staff login flow</li>
          <li>Role-based backend integration ready</li>
          <li>Responsive layout for desktop and mobile</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Login</h2>
        <p>Use your account credentials to continue.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@footbook.com"
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
            <label className="check">
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Remember me
            </label>
            <a href="#" className="link">Forgot password?</a>
          </div>

          <button type="submit" className="btn">Sign in</button>
          <div className={`status ${status.type || ""}`} aria-live="polite">
            {status.message}
          </div>
        </form>

        <div className="quick-links">
          Need admin tools? <a href={adminPanelPath} className="link">Open admin panel</a>
        </div>
      </section>
    </div>
  );
}

export default AdminLogin;
