import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/home.css";

const DEFAULT_PRIMARY = {
  text: "Start Booking",
  to: "/user-signup"
};

const DEFAULT_SECONDARY = {
  text: "I Already Have An Account",
  to: "/user-login"
};

function clearStoredSession() {
  localStorage.removeItem("footbook.token");
  localStorage.removeItem("footbook.user");
  sessionStorage.removeItem("footbook.token");
  sessionStorage.removeItem("footbook.user");
}

function readStoredSession() {
  const token =
    localStorage.getItem("footbook.token") ||
    sessionStorage.getItem("footbook.token");
  const rawUser =
    localStorage.getItem("footbook.user") ||
    sessionStorage.getItem("footbook.user");

  if (!token || !rawUser) {
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(rawUser)
    };
  } catch (error) {
    return null;
  }
}

function Home() {
  const navigate = useNavigate();
  const [primaryCta, setPrimaryCta] = useState(DEFAULT_PRIMARY);
  const [secondaryCta, setSecondaryCta] = useState(DEFAULT_SECONDARY);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    document.title = "Footbook | Book Your Match";

    const session = readStoredSession();
    if (!session) {
      setPrimaryCta(DEFAULT_PRIMARY);
      setSecondaryCta(DEFAULT_SECONDARY);
      setShowLogout(false);
      return;
    }

    const role = String(session.user.role || "USER").toUpperCase();
    if (role === "ADMIN") {
      setPrimaryCta({ text: "Go to admin panel", to: "/admin-panel" });
    } else if (role === "OWNER") {
      setPrimaryCta({ text: "Go to owner panel", to: "/owner-dashboard" });
    } else {
      setPrimaryCta({ text: "Go to player dashboard", to: "/user-dashboard" });
    }

    setSecondaryCta({ text: "Logout", to: "/" });
    setShowLogout(true);
  }, []);

  const handleLogout = (event) => {
    event.preventDefault();
    clearStoredSession();
    navigate("/");
  };

  return (
    <div>
      <div className="ambient ambient-left" aria-hidden="true"></div>
      <div className="ambient ambient-right" aria-hidden="true"></div>

      <div className="page-shell">
        <header className="site-header">
          <div className="brand">
            <span className="brand-mark"></span>FOOTBOOK
          </div>
          <nav className="top-nav" aria-label="Primary">
            <Link to="/user-login">Player Login</Link>
            <Link to="/admin-login">Admin Login</Link>
          </nav>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Weekend leagues. Midweek rivalries. Zero friction.</p>
              <h1>Find your field.<br />Lock your slot.<br />Play on time.</h1>
              <p className="lead">
                Footbook keeps stadium booking smooth for players and simple for venue
                managers. No phone calls, no guesswork, no overbooking.
              </p>
              <div className="actions">
                <Link className="button primary" to={primaryCta.to}>
                  {primaryCta.text}
                </Link>
                {showLogout ? (
                  <a className="button ghost" href={secondaryCta.to} onClick={handleLogout}>
                    {secondaryCta.text}
                  </a>
                ) : (
                  <Link className="button ghost" to={secondaryCta.to}>
                    {secondaryCta.text}
                  </Link>
                )}
                <Link className="button secondary" to="/admin-panel">
                  Open Admin Panel
                </Link>
              </div>
            </div>
            <div className="hero-panel" aria-label="Platform highlights">
              <div className="kpi">
                <span className="kpi-label">Booking Time</span>
                <strong>30 sec</strong>
              </div>
              <div className="kpi">
                <span className="kpi-label">Schedule Sync</span>
                <strong>Real-time</strong>
              </div>
              <div className="kpi">
                <span className="kpi-label">Access</span>
                <strong>JWT secured</strong>
              </div>
            </div>
          </section>

          <section className="feature-grid" aria-label="Key capabilities">
            <article className="feature-card">
              <h2>Built for Players</h2>
              <p>
                Check availability instantly, reserve your favorite slot, and manage your
                match plans in one clear dashboard.
              </p>
            </article>
            <article className="feature-card">
              <h2>Built for Venues</h2>
              <p>
                Control inventory, monitor bookings, and optimize usage with one admin
                workspace designed for operational speed.
              </p>
            </article>
            <article className="feature-card wide">
              <h2>How It Works</h2>
              <ol>
                <li>Create your account in under a minute.</li>
                <li>Select a stadium and preferred time slot.</li>
                <li>Confirm your booking and track it in your dashboard.</li>
              </ol>
            </article>
          </section>
        </main>

        <footer className="site-footer">
          <div className="footer-links">
            <Link to="/user-signup">Create Player Account</Link>
            <Link to="/user-login">Player Sign In</Link>
            <Link to="/admin-login">Admin Sign In</Link>
            <Link to="/admin-panel">Admin Dashboard</Link>
          </div>
          <p>&copy; 2026 Footbook. Plan less, play more.</p>
        </footer>
      </div>
    </div>
  );
}

export default Home;
