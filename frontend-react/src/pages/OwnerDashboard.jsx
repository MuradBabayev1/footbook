import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/owner-dashboard.css";
import { clearStoredSession, readStoredUser, getAuthToken } from "../services/session";

const emptyForm = {
  id: "",
  name: "",
  city: "",
  location: "",
  capacity: "",
  available: "true"
};

function OwnerDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [stadiums, setStadiums] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [ready, setReady] = useState(false);

  const authHeaders = useCallback((includeJson = true) => {
    const token = getAuthToken();
    const headers = {
      Authorization: `Bearer ${token}`
    };
    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }, []);

  useEffect(() => {
    document.title = "Footbook | Owner Panel";

    const token = getAuthToken();
    const user = readStoredUser();

    if (!token || !user) {
      clearStoredSession();
      navigate("/user-login", { replace: true });
      return;
    }

    const role = String(user.role || "").toUpperCase();
    if (role !== "OWNER") {
      navigate("/user-dashboard", { replace: true });
      return;
    }

    setCurrentUser(user);
    document.body.classList.add("auth-ready");
    setReady(true);

    return () => {
      document.body.classList.remove("auth-ready");
    };
  }, [navigate]);

  const loadMyStadiums = useCallback(async () => {
    try {
      const response = await fetch("/api/stadiums/owner/mine", {
        headers: authHeaders(false)
      });

      if (response.status === 401 || response.status === 403) {
        navigate("/user-login", { replace: true });
        return;
      }

      if (!response.ok) {
        setStadiums([]);
        return;
      }

      const data = await response.json().catch(() => []);
      setStadiums(Array.isArray(data) ? data : []);
    } catch (error) {
      setStadiums([]);
    }
  }, [authHeaders, navigate]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    loadMyStadiums();
  }, [loadMyStadiums, ready]);

  const updateFormStatus = (message, type = "") => {
    setStatus({ message, type });
  };

  const resetForm = () => {
    setFormData(emptyForm);
    updateFormStatus("");
  };

  const startEdit = (stadiumId) => {
    const target = stadiums.find((item) => String(item.id) === String(stadiumId));
    if (!target) {
      return;
    }

    setFormData({
      id: target.id,
      name: target.name || "",
      city: target.city || "",
      location: target.location || "",
      capacity: target.capacity ?? "",
      available: String(Boolean(target.available))
    });
    updateFormStatus("");
  };

  const saveStadium = async (event) => {
    event.preventDefault();

    const payload = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      location: formData.location.trim(),
      capacity: Number(formData.capacity),
      available: formData.available === "true"
    };

    if (!payload.name || !payload.city || !payload.location || !payload.capacity || payload.capacity <= 0) {
      updateFormStatus("Please fill all fields correctly.", "error");
      return;
    }

    const isEditing = Boolean(formData.id);
    const endpoint = isEditing ? `/api/stadiums/owner/${formData.id}` : "/api/stadiums";
    const method = isEditing ? "PUT" : "POST";

    try {
      updateFormStatus(isEditing ? "Updating stadium..." : "Creating stadium...");
      const response = await fetch(endpoint, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        updateFormStatus(data.message || data.error || "Access denied for this action.", "error");
        return;
      }

      if (!response.ok) {
        updateFormStatus(data.message || data.error || "Unable to save stadium.", "error");
        return;
      }

      updateFormStatus(isEditing ? "Stadium updated successfully." : "Stadium created successfully.", "ok");
      resetForm();
      await loadMyStadiums();
    } catch (error) {
      updateFormStatus("Unable to save stadium right now.", "error");
    }
  };

  const removeStadium = async (stadiumId) => {
    const confirmed = window.confirm("Delete this stadium?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/stadiums/owner/${stadiumId}`, {
        method: "DELETE",
        headers: authHeaders(false)
      });

      if (response.status === 401 || response.status === 403) {
        updateFormStatus("You are not allowed to delete this stadium.", "error");
        return;
      }

      if (!response.ok) {
        updateFormStatus("Unable to delete stadium.", "error");
        return;
      }

      updateFormStatus("Stadium deleted.", "ok");
      await loadMyStadiums();
    } catch (error) {
      updateFormStatus("Unable to delete stadium.", "error");
    }
  };

  const handleLogout = (event) => {
    event.preventDefault();
    clearStoredSession();
    navigate("/");
  };

  const totalStadiums = stadiums.length;
  const availableStadiums = stadiums.filter((item) => item.available).length;
  const unavailableStadiums = totalStadiums - availableStadiums;

  return (
    <div className="owner-layout">
      <header className="owner-topbar">
        <div>
          <p className="kicker">Footbook Owner Hub</p>
          <h1>Owner Stadium Panel</h1>
          <p className="sub">
            {currentUser
              ? `Signed in as ${currentUser.fullName || currentUser.email || "Owner"}`
              : "Signed in as Owner"}
          </p>
        </div>
        <a href="/" className="btn secondary" onClick={handleLogout}>Logout</a>
      </header>

      <section className="stats">
        <article className="card">
          <h2>Total My Stadiums</h2>
          <strong>{totalStadiums}</strong>
        </article>
        <article className="card">
          <h2>Available</h2>
          <strong>{availableStadiums}</strong>
        </article>
        <article className="card">
          <h2>Unavailable</h2>
          <strong>{unavailableStadiums}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>{formData.id ? "Update Stadium" : "Add New Stadium"}</h2>
          <button type="button" className="btn secondary" onClick={resetForm}>Reset</button>
        </div>
        <form onSubmit={saveStadium} noValidate>
          <input type="hidden" value={formData.id} readOnly />
          <div className="grid">
            <div className="field">
              <label htmlFor="name">Stadium Name</label>
              <input
                id="name"
                name="name"
                type="text"
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
                required
                value={formData.city}
                onChange={(event) => setFormData({ ...formData, city: event.target.value })}
              />
            </div>
            <div className="field full">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
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
          <div className="actions">
            <button type="submit" className="btn">
              {formData.id ? "Update Stadium" : "Create Stadium"}
            </button>
          </div>
          <div className={`status ${status.type || ""}`} aria-live="polite">
            {status.message}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>My Stadiums</h2>
          <button type="button" className="btn secondary" onClick={loadMyStadiums}>
            Refresh
          </button>
        </div>
        <div className="table-wrap">
          <table>
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
                      <span className={`pill ${stadium.available ? "available" : "unavailable"}`}>
                        {stadium.available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="edit" onClick={() => startEdit(stadium.id)}>
                          Edit
                        </button>
                        <button type="button" className="delete" onClick={() => removeStadium(stadium.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty">
                    {ready ? "No stadiums yet. Add your first stadium." : "Loading stadiums..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default OwnerDashboard;
