import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin-panel.css";
import { getAllBookings, approveBooking } from "../services/bookingService";
import { clearStoredSession, readStoredUser, getAuthToken } from "../services/session";
import {
  createStadium,
  deleteStadium,
  getAllStadiums,
  getStadiumById,
  updateStadium
} from "../services/stadiumService";
import { deleteUser, getAllUsers } from "../services/userService";

const emptyForm = {
  id: "",
  name: "",
  city: "",
  location: "",
  capacity: "",
  available: "true"
};

function AdminPanel() {
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState("Live mode: Active");
  const [stadiums, setStadiums] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    totalUsers: 0,
    cancelledBookings: 0
  });
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [ready, setReady] = useState(false);

  const handleUnauthorized = useCallback(() => {
    clearStoredSession();
    navigate("/admin-login", { replace: true });
  }, [navigate]);

  const setStatusMessage = useCallback((message, type = "") => {
    setStatus({ message, type });
  }, []);

  const loadStadiums = useCallback(async () => {
    setStadiums([]);
    try {
      const response = await getAllStadiums();
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        setStadiums([]);
        return;
      }
      const data = response.data || [];
      setStadiums(Array.isArray(data) ? data : []);
    } catch (error) {
      setStadiums([]);
    }
  }, [handleUnauthorized]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await getAllUsers();
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        setUsers([]);
        return;
      }
      const data = response.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setUsers([]);
    }
  }, [handleUnauthorized]);

  const loadBookings = useCallback(async () => {
    try {
      const response = await getAllBookings();
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        setBookings([]);
        return;
      }
      const data = response.data || [];
      const safeBookings = Array.isArray(data) ? data : [];
      safeBookings.sort((a, b) => {
        const aStatus = String(a.status || "").toUpperCase();
        const bStatus = String(b.status || "").toUpperCase();
        if (aStatus !== bStatus) {
          return aStatus === "PENDING" ? -1 : 1;
        }
        return Number(b.id || 0) - Number(a.id || 0);
      });
      setBookings(safeBookings);
    } catch (error) {
      setBookings([]);
    }
  }, [handleUnauthorized]);

  const loadStats = useCallback(async () => {
    try {
      const [bookingsResponse, usersResponse, stadiumsResponse] = await Promise.all([
        getAllBookings(),
        getAllUsers(),
        getAllStadiums()
      ]);
      if ([bookingsResponse, usersResponse, stadiumsResponse].some(
        (response) => response.status === 401 || response.status === 403
      )) {
        handleUnauthorized();
        return;
      }

      const bookingsData = bookingsResponse.ok ? bookingsResponse.data || [] : [];
      const usersData = usersResponse.ok ? usersResponse.data || [] : [];
      const stadiumsData = stadiumsResponse.ok ? stadiumsResponse.data || [] : [];

      const safeBookings = Array.isArray(bookingsData) ? bookingsData : [];
      const safeUsers = Array.isArray(usersData) ? usersData : [];
      const safeStadiums = Array.isArray(stadiumsData) ? stadiumsData : [];

      setStats({
        totalBookings: safeBookings.length,
        pendingBookings: safeBookings.filter(
          (booking) => String(booking.status || "").toUpperCase() === "PENDING"
        ).length,
        totalUsers: safeUsers.length,
        cancelledBookings: safeBookings.filter(
          (booking) => String(booking.status || "").toUpperCase() === "CANCELLED"
        ).length
      });

      setSessionInfo(`${safeStadiums.length} stadiums live`);
    } catch (error) {
      setStats({
        totalBookings: 0,
        pendingBookings: 0,
        totalUsers: 0,
        cancelledBookings: 0
      });
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    document.title = "Footbook | Admin Panel";

    const token = getAuthToken();
    const user = readStoredUser();
    if (!token || !user) {
      handleUnauthorized();
      return;
    }

    const role = String(user.role || "").toUpperCase();
    if (role !== "ADMIN") {
      handleUnauthorized();
      return;
    }

    setSessionInfo(`Signed in: ${user.fullName || user.email || "Admin"}`);
    document.body.classList.add("auth-ready");
    setReady(true);

    return () => {
      document.body.classList.remove("auth-ready");
    };
  }, [handleUnauthorized]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    loadStadiums();
    loadUsers();
    loadBookings();
    loadStats();
  }, [ready, loadBookings, loadStadiums, loadStats, loadUsers]);

  const resetForm = () => {
    setFormData(emptyForm);
  };

  const openForm = (stadium = null) => {
    if (stadium) {
      setFormData({
        id: stadium.id,
        name: stadium.name || "",
        city: stadium.city || "",
        location: stadium.location || "",
        capacity: stadium.capacity ?? "",
        available: String(Boolean(stadium.available))
      });
    } else {
      resetForm();
    }
    setFormVisible(true);
    setStatusMessage("", "");
  };

  const closeForm = () => {
    setFormVisible(false);
    resetForm();
    setStatusMessage("", "");
  };

  const handleSaveStadium = async (event) => {
    event.preventDefault();

    const payload = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      location: formData.location.trim(),
      capacity: Number(formData.capacity),
      available: formData.available === "true"
    };

    if (!payload.name || !payload.city || !payload.location || !payload.capacity) {
      setStatusMessage("Please complete all stadium fields.", "error");
      return;
    }

    const isEditing = Boolean(formData.id);

    try {
      setStatusMessage(isEditing ? "Updating stadium..." : "Creating stadium...");
      const response = isEditing
        ? await updateStadium(formData.id, payload)
        : await createStadium(payload);
      const data = response.data || {};

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setStatusMessage(
          data.message || data.error || String(data) || "Unable to save stadium.",
          "error"
        );
        return;
      }

      setStatusMessage(
        isEditing ? "Stadium updated successfully." : "Stadium added successfully.",
        "success"
      );
      closeForm();
      await loadStadiums();
      await loadStats();
    } catch (error) {
      setStatusMessage("Unable to save stadium right now.", "error");
    }
  };

  const handleDeleteStadium = async (stadiumId) => {
    const confirmed = window.confirm("Delete this stadium?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await deleteStadium(stadiumId);

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setStatusMessage("Unable to delete stadium.", "error");
        return;
      }

      setStatusMessage("Stadium deleted.", "success");
      await loadStadiums();
      await loadStats();
    } catch (error) {
      setStatusMessage("Unable to delete stadium right now.", "error");
    }
  };

  const handleEditStadium = async (stadiumId) => {
    try {
      const response = await getStadiumById(stadiumId);

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setStatusMessage("Unable to load stadium details.", "error");
        return;
      }

      const data = response.data || null;
      if (data) {
        openForm(data);
        setStatusMessage(`Editing ${data.name}.`, "success");
      }
    } catch (error) {
      setStatusMessage("Unable to load stadium details.", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm("Delete this user? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      const response = await deleteUser(userId);

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setStatusMessage("Unable to delete user.", "error");
        return;
      }

      setStatusMessage("User deleted successfully.", "success");
      await loadUsers();
      await loadStats();
    } catch (error) {
      setStatusMessage("Unable to delete user right now.", "error");
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      const response = await approveBooking(bookingId);

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setStatusMessage("Unable to approve booking.", "error");
        return;
      }

      setStatusMessage(`Booking #${bookingId} approved.`, "success");
      await loadBookings();
      await loadStats();
    } catch (error) {
      setStatusMessage("Unable to approve booking right now.", "error");
    }
  };

  const handleLogout = (event) => {
    event.preventDefault();
    clearStoredSession();
    navigate("/");
  };

  const stadiumStatusClass = status.type ? `status-message ${status.type}` : "status-message";

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"></span> FOOTBOOK ADMIN
        </div>
        <nav className="menu">
          <a href="#" className="active">Dashboard</a>
          <a href="#stadium-manager">Stadiums</a>
          <a href="#recent-bookings">Bookings</a>
          <a href="#users-manager">Users</a>
          <a href="#">Payments</a>
          <a href="/" onClick={handleLogout}>Logout</a>
        </nav>
      </aside>

      <main className="content">
        <section className="top">
          <div>
            <h1>Operations Dashboard</h1>
            <div className="muted">Daily overview for venues, bookings, and payments.</div>
          </div>
          <div className="pill" id="sessionInfo">{sessionInfo}</div>
        </section>

        <section className="grid">
          <article className="card">
            <h2>Total Bookings</h2>
            <div className="value">{stats.totalBookings}</div>
            <div className="sub up">All recorded bookings</div>
          </article>

          <article className="card">
            <h2>Pending Approvals</h2>
            <div className="value">{stats.pendingBookings}</div>
            <div className="sub warn">Bookings waiting review</div>
          </article>

          <article className="card">
            <h2>Total Users</h2>
            <div className="value">{stats.totalUsers}</div>
            <div className="sub up">Registered accounts</div>
          </article>

          <article className="card">
            <h2>Cancelled</h2>
            <div className="value">{stats.cancelledBookings}</div>
            <div className="sub down">Cancelled bookings</div>
          </article>
        </section>

        <section className="manager card" id="stadium-manager">
          <div className="manager-head">
            <div>
              <h2>Stadium Manager</h2>
              <p className="muted">Add, edit, or remove stadiums from the live catalog.</p>
            </div>
            <div className="actions">
              <button className="btn" type="button" onClick={() => openForm()}>
                Add Stadium
              </button>
              <button className="btn secondary" type="button" onClick={loadStadiums}>
                Refresh
              </button>
            </div>
          </div>

          <form className="stadium-form" hidden={!formVisible} onSubmit={handleSaveStadium}>
            <input type="hidden" value={formData.id} readOnly />
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Stadium Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="City Arena"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Dhaka"
                  required
                  value={formData.city}
                  onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                />
              </div>
              <div className="field wide">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Road 12, Dhanmondi"
                  required
                  value={formData.location}
                  onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="capacity">Capacity</label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  placeholder="1200"
                  required
                  value={formData.capacity}
                  onChange={(event) => setFormData({ ...formData, capacity: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="available">Availability</label>
                <select
                  id="available"
                  name="available"
                  value={formData.available}
                  onChange={(event) => setFormData({ ...formData, available: event.target.value })}
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>
            </div>

            <div className="actions form-actions">
              <button className="btn" type="submit">
                {formData.id ? "Update Stadium" : "Save Stadium"}
              </button>
              <button className="btn secondary" type="button" onClick={closeForm}>
                Cancel
              </button>
            </div>
            <div className={stadiumStatusClass} aria-live="polite">
              {status.message}
            </div>
          </form>

          <div className="table-wrap manager-table">
            <table aria-label="Stadium catalog">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stadiums.length ? (
                  stadiums.map((stadium) => (
                    <tr key={stadium.id}>
                      <td>{stadium.name || "-"}</td>
                      <td>{stadium.city || "-"}</td>
                      <td>{stadium.location || "-"}</td>
                      <td>{stadium.capacity ?? "-"}</td>
                      <td>
                        <span
                          className={`status ${stadium.available ? "confirmed" : "pending"}`}
                        >
                          {stadium.available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="edit"
                            onClick={() => handleEditStadium(stadium.id)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="delete"
                            onClick={() => handleDeleteStadium(stadium.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      {ready ? "No stadiums found. Add one to get started." : "Loading stadiums..."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="manager card" id="users-manager">
          <div className="manager-head">
            <div>
              <h2>Users</h2>
              <p className="muted">Registered players and admins in the system.</p>
            </div>
            <div className="actions">
              <button className="btn secondary" type="button" onClick={loadUsers}>
                Refresh Users
              </button>
            </div>
          </div>

          <div className="table-wrap manager-table">
            <table aria-label="Users table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id ?? "-"}</td>
                      <td>{user.fullName || "-"}</td>
                      <td>{user.email || "-"}</td>
                      <td>{user.phoneNumber || "-"}</td>
                      <td>
                        <span
                          className={`status ${
                            String(user.role || "").toUpperCase() === "OWNER"
                              ? "confirmed"
                              : "pending"
                          }`}
                        >
                          {String(user.role || "USER").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="delete"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      {ready ? "No users found." : "Loading users..."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="manager card" id="recent-bookings">
          <div className="manager-head">
            <div>
              <h2>Booking Requests</h2>
              <p className="muted">Approve pending bookings submitted by users.</p>
            </div>
            <div className="actions">
              <button className="btn secondary" type="button" onClick={loadBookings}>
                Refresh Bookings
              </button>
            </div>
          </div>

          <div className="table-wrap manager-table">
            <table aria-label="Booking requests">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>User ID</th>
                  <th>Stadium ID</th>
                  <th>Match</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length ? (
                  bookings.map((booking) => {
                    const statusLabel = String(booking.status || "").toUpperCase();
                    return (
                      <tr key={booking.id}>
                        <td>#{booking.id ?? "-"}</td>
                        <td>{booking.userId ?? "-"}</td>
                        <td>{booking.stadiumId ?? "-"}</td>
                        <td>{booking.matchTitle || "-"}</td>
                        <td>{booking.bookingDate || "-"}</td>
                        <td>
                          <span className={`status ${statusLabel === "CONFIRMED" ? "confirmed" : "pending"}`}>
                            {statusLabel || "-"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            {statusLabel === "PENDING" ? (
                              <button
                                type="button"
                                className="edit"
                                onClick={() => handleApproveBooking(booking.id)}
                              >
                                Accept
                              </button>
                            ) : (
                              <span className="muted">No action</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      {ready ? "No booking requests found." : "Loading bookings..."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="actions">
          <button className="btn secondary" type="button">Export Report</button>
        </section>
      </main>
    </div>
  );
}

export default AdminPanel;
