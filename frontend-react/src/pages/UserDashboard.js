import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/user-dashboard.css";

function clearStoredSession() {
  localStorage.removeItem("footbook.token");
  localStorage.removeItem("footbook.user");
  sessionStorage.removeItem("footbook.token");
  sessionStorage.removeItem("footbook.user");
}

function readStoredUser() {
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

function getAuthToken() {
  return (
    localStorage.getItem("footbook.token") ||
    sessionStorage.getItem("footbook.token")
  );
}

function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) {
    return "-";
  }

  return `${startTime || "--:--"} - ${endTime || "--:--"}`;
}

function UserDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [stadiums, setStadiums] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardStatus, setDashboardStatus] = useState("Ready");
  const [bookingStatus, setBookingStatus] = useState({ message: "", type: "" });
  const [bookingForm, setBookingForm] = useState({
    stadiumId: "",
    matchTitle: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    attendees: ""
  });
  const [minDate, setMinDate] = useState("");
  const [ready, setReady] = useState(false);

  const authHeaders = useCallback((includeJson = true) => {
    const token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };
    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }, []);

  useEffect(() => {
    document.title = "Footbook | User Dashboard";

    const token = getAuthToken();
    const user = readStoredUser();

    if (!token || !user) {
      clearStoredSession();
      navigate("/user-login", { replace: true });
      return;
    }

    const role = String(user.role || "USER").toUpperCase();
    if (role === "OWNER") {
      navigate("/owner-dashboard", { replace: true });
      return;
    }

    setCurrentUser(user);
    document.body.classList.add("auth-ready");
    setReady(true);

    return () => {
      document.body.classList.remove("auth-ready");
    };
  }, [navigate]);

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setMinDate(`${year}-${month}-${day}`);
  }, []);

  const applySearchFilter = useCallback((items) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((stadium) =>
      [stadium.name, stadium.city, stadium.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const loadStadiums = useCallback(async () => {
    setDashboardStatus("Loading stadiums...");

    let loadedStadiums = [];
    try {
      const primaryResponse = await fetch("/api/stadiums/available", {
        headers: authHeaders(false)
      });

      if (primaryResponse.status === 401 || primaryResponse.status === 403) {
        navigate("/user-login", { replace: true });
        return;
      }

      if (primaryResponse.ok) {
        const data = await primaryResponse.json().catch(() => []);
        loadedStadiums = Array.isArray(data) ? data : [];
      }
    } catch (error) {
      loadedStadiums = [];
    }

    if (!loadedStadiums.length) {
      try {
        const fallbackResponse = await fetch("/api/stadiums", {
          headers: authHeaders(false)
        });

        if (fallbackResponse.status === 401 || fallbackResponse.status === 403) {
          navigate("/user-login", { replace: true });
          return;
        }

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json().catch(() => []);
          const safeData = Array.isArray(data) ? data : [];
          loadedStadiums = safeData.filter(
            (stadium) => stadium && stadium.available !== false
          );
        }
      } catch (error) {
        setDashboardStatus("Unable to load stadiums.", "error");
      }
    }

    setStadiums(loadedStadiums);
    setDashboardStatus("Dashboard ready.");
  }, [authHeaders, navigate]);

  const loadBookings = useCallback(async () => {
    try {
      const response = await fetch("/api/bookings", {
        headers: authHeaders(false)
      });

      if (response.status === 401 || response.status === 403) {
        navigate("/user-login", { replace: true });
        return;
      }

      if (!response.ok) {
        setBookings([]);
        setBookingStatus({ message: `Unable to load bookings (${response.status}).`, type: "error" });
        return;
      }

      const data = await response.json().catch(() => []);
      setBookings(Array.isArray(data) ? data : []);
      setBookingStatus({ message: "", type: "" });
    } catch (error) {
      setBookings([]);
      setBookingStatus({ message: "Unable to load bookings. Please refresh.", type: "error" });
    }
  }, [authHeaders, navigate]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    loadStadiums();
    loadBookings();
  }, [loadBookings, loadStadiums, ready]);

  const handleBookingStatus = (message, type = "") => {
    setBookingStatus({ message, type });
  };

  const getStadiumName = useCallback((stadiumId) => {
    const stadium = stadiums.find((item) => String(item.id) === String(stadiumId));
    return stadium ? stadium.name : `Stadium #${stadiumId}`;
  }, [stadiums]);

  const createBooking = async (event) => {
    event.preventDefault();

    const payload = {
      stadiumId: Number(bookingForm.stadiumId),
      matchTitle: bookingForm.matchTitle.trim(),
      bookingDate: bookingForm.bookingDate,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      attendees: Number(bookingForm.attendees),
      status: "PENDING"
    };

    const userId = currentUser?.userId ?? currentUser?.id ?? null;
    if (userId) {
      payload.userId = userId;
    }

    if (!payload.stadiumId || !payload.matchTitle || !payload.bookingDate || !payload.startTime || !payload.endTime || !payload.attendees) {
      handleBookingStatus("Please complete all booking fields.", "error");
      return;
    }

    const bookingDate = new Date(`${payload.bookingDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      handleBookingStatus("Booking date cannot be in the past.", "error");
      return;
    }

    if (payload.endTime <= payload.startTime) {
      handleBookingStatus("End time must be after start time.", "error");
      return;
    }

    if (!Number.isInteger(payload.attendees) || payload.attendees <= 0) {
      handleBookingStatus("Attendees must be a positive whole number.", "error");
      return;
    }

    try {
      handleBookingStatus("Creating booking...");
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        navigate("/user-login", { replace: true });
        return;
      }

      if (!response.ok) {
        handleBookingStatus(data.message || data.error || String(data) || "Unable to create booking.", "error");
        return;
      }

      setBookingForm({
        stadiumId: "",
        matchTitle: "",
        bookingDate: "",
        startTime: "",
        endTime: "",
        attendees: ""
      });

      handleBookingStatus("Booking created successfully.", "success");

      if (data && typeof data === "object" && data.id) {
        setBookings((prev) => [data, ...prev.filter((booking) => String(booking.id) !== String(data.id))]);
      }

      await loadBookings();
    } catch (error) {
      handleBookingStatus("Unable to create booking.", "error");
    }
  };

  const cancelBooking = async (bookingId) => {
    const confirmed = window.confirm("Cancel this booking?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: "CANCELLED" })
      });

      if (response.status === 401 || response.status === 403) {
        navigate("/user-login", { replace: true });
        return;
      }

      if (!response.ok) {
        handleBookingStatus("Unable to cancel booking.", "error");
        return;
      }

      handleBookingStatus("Booking cancelled.", "success");
      await loadBookings();
    } catch (error) {
      handleBookingStatus("Unable to cancel booking.", "error");
    }
  };

  const handleLogout = (event) => {
    event.preventDefault();
    clearStoredSession();
    navigate("/");
  };

  const filteredStadiums = useMemo(() => applySearchFilter(stadiums), [applySearchFilter, stadiums]);
  const bookingCount = bookings.length;
  const upcomingCount = bookings.filter((booking) => booking.status !== "CANCELLED").length;

  return (
    <div className="dashboard-page">
      <header className="topbar">
        <div className="brand-wrap">
          <span className="brand-mark" aria-hidden="true"></span>
          <div>
            <p className="brand-kicker">Footbook</p>
            <h1>Player Dashboard</h1>
          </div>
        </div>

        <div className="user-chip">
          <div>
            <p className="user-chip-label">Signed in as</p>
            <p className="user-chip-name">
              {currentUser?.fullName || currentUser?.email || "Player"}
            </p>
            <p className="user-chip-email">{currentUser?.email || ""}</p>
          </div>
          <a href="/" className="btn secondary" onClick={handleLogout}>Logout</a>
        </div>
      </header>

      <nav className="jump-nav" aria-label="Dashboard sections">
        <a href="#overview" className="active">Overview</a>
        <a href="#stadiums">Stadiums</a>
        <a href="#booking">New Booking</a>
        <a href="#my-bookings">My Bookings</a>
      </nav>

      <main className="content">
        <section className="spotlight" id="overview">
          <div className="spotlight-copy">
            <p className="eyebrow">Your Match Command Center</p>
            <h2>Plan smarter games with one clear workflow.</h2>
            <p className="lead">
              Browse open venues, create bookings in seconds, and watch your upcoming matches
              update in real time.
            </p>
          </div>
          <div className="spotlight-actions">
            <a className="btn primary" href="#booking">Create Booking</a>
            <a className="btn ghost" href="#stadiums">Browse Stadiums</a>
          </div>
        </section>

        <section className="metrics" aria-label="Booking overview">
          <article className="metric-card">
            <p>Available Stadiums</p>
            <strong>{stadiums.length}</strong>
          </article>
          <article className="metric-card">
            <p>Total Bookings</p>
            <strong>{bookingCount}</strong>
          </article>
          <article className="metric-card">
            <p>Upcoming Matches</p>
            <strong>{upcomingCount}</strong>
          </article>
          <article className="metric-card">
            <p>System Status</p>
            <strong id="dashboardStatus" className={dashboardStatus === "Dashboard ready." ? "" : "error"}>
              {dashboardStatus}
            </strong>
          </article>
        </section>

        <section className="panel" id="stadiums">
          <div className="panel-head">
            <div>
              <h3>Available Stadiums</h3>
              <p>Find your best spot by city, name, or location.</p>
            </div>
            <div className="panel-actions">
              <input
                type="search"
                placeholder="Search by city or name"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button className="btn secondary" type="button" onClick={loadStadiums}>
                Refresh
              </button>
            </div>
          </div>
          <div className="stadium-grid">
            {filteredStadiums.length ? (
              filteredStadiums.map((stadium) => (
                <article className="stadium-card" key={stadium.id}>
                  <h3>{stadium.name}</h3>
                  <div className="stadium-meta">
                    <span><strong>City:</strong> {stadium.city || "-"}</span>
                    <span><strong>Location:</strong> {stadium.location || "-"}</span>
                    <span><strong>Capacity:</strong> {stadium.capacity ?? "-"}</span>
                  </div>
                  <div className="stadium-footer">
                    <span className={`chip ${stadium.available ? "available" : "unavailable"}`}>
                      {stadium.available ? "Available" : "Unavailable"}
                    </span>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => setBookingForm({ ...bookingForm, stadiumId: String(stadium.id) })}
                    >
                      Book
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No available stadiums right now.</div>
            )}
          </div>
        </section>

        <section className="workspace">
          <section className="panel" id="booking">
            <div className="panel-head compact">
              <div>
                <h3>Create Booking</h3>
                <p>Reserve your slot with accurate match details.</p>
              </div>
            </div>

            <form className="booking-form" onSubmit={createBooking} noValidate>
              <div className="field">
                <label htmlFor="stadiumId">Stadium</label>
                <select
                  id="stadiumId"
                  name="stadiumId"
                  required
                  value={bookingForm.stadiumId}
                  onChange={(event) => setBookingForm({ ...bookingForm, stadiumId: event.target.value })}
                >
                  {stadiums.length ? (
                    stadiums.map((stadium) => (
                      <option key={stadium.id} value={stadium.id}>
                        {stadium.name} - {stadium.city}
                      </option>
                    ))
                  ) : (
                    <option value="">No stadiums available</option>
                  )}
                </select>
              </div>
              <div className="field">
                <label htmlFor="matchTitle">Match Title</label>
                <input
                  id="matchTitle"
                  name="matchTitle"
                  type="text"
                  placeholder="Friday Friendly"
                  required
                  value={bookingForm.matchTitle}
                  onChange={(event) => setBookingForm({ ...bookingForm, matchTitle: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="bookingDate">Booking Date</label>
                <input
                  id="bookingDate"
                  name="bookingDate"
                  type="date"
                  min={minDate}
                  required
                  value={bookingForm.bookingDate}
                  onChange={(event) => setBookingForm({ ...bookingForm, bookingDate: event.target.value })}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    required
                    value={bookingForm.startTime}
                    onChange={(event) => setBookingForm({ ...bookingForm, startTime: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="endTime">End Time</label>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    required
                    value={bookingForm.endTime}
                    onChange={(event) => setBookingForm({ ...bookingForm, endTime: event.target.value })}
                  />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="attendees">Attendees</label>
                  <input
                    id="attendees"
                    name="attendees"
                    type="number"
                    min="1"
                    placeholder="10"
                    required
                    value={bookingForm.attendees}
                    onChange={(event) => setBookingForm({ ...bookingForm, attendees: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Status</label>
                  <div className="status-pill">Pending confirmation</div>
                </div>
              </div>
              <button type="submit" className="btn primary">Submit Booking</button>
              <div className={`message ${bookingStatus.type || ""}`} aria-live="polite">
                {bookingStatus.message}
              </div>
            </form>
          </section>

          <section className="panel tips-panel">
            <div className="panel-head compact">
              <div>
                <h3>Pro Tips</h3>
                <p>Keep your booking process smooth every time.</p>
              </div>
            </div>
            <ul className="tips">
              <li>Choose available stadiums to avoid validation issues.</li>
              <li>Keep start and end times realistic and non-overlapping.</li>
              <li>Pending bookings can be confirmed by admins later.</li>
            </ul>
          </section>
        </section>

        <section className="panel" id="my-bookings">
          <div className="panel-head">
            <div>
              <h3>My Bookings</h3>
              <p>Track all your scheduled and completed matches.</p>
            </div>
            <button className="btn secondary" type="button" onClick={loadBookings}>
              Refresh
            </button>
          </div>
          <div className="table-wrap">
            <table aria-label="My bookings">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Stadium</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Attendees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length ? (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.matchTitle || "-"}</td>
                      <td>{getStadiumName(booking.stadiumId)}</td>
                      <td>{booking.bookingDate || "-"}</td>
                      <td>{formatTimeRange(booking.startTime, booking.endTime)}</td>
                      <td>{booking.attendees ?? "-"}</td>
                      <td>
                        <div className="row-actions">
                          <span className={`chip ${booking.status === "CONFIRMED" ? "available" : "unavailable"}`}>
                            {booking.status || "-"}
                          </span>
                          {booking.status === "CANCELLED" ? null : (
                            <button type="button" className="cancel" onClick={() => cancelBooking(booking.id)}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      {ready ? "No bookings yet." : "Loading bookings..."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;
