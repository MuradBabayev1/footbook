const token = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
const rawUser = localStorage.getItem("footbook.user") || sessionStorage.getItem("footbook.user");

const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");
const logoutLink = document.getElementById("logoutLink");
const stadiumGrid = document.getElementById("stadiumGrid");
const stadiumSearch = document.getElementById("stadiumSearch");
const refreshStadiums = document.getElementById("refreshStadiums");
const availableCount = document.getElementById("availableCount");
const bookingCount = document.getElementById("bookingCount");
const upcomingCount = document.getElementById("upcomingCount");
const dashboardStatus = document.getElementById("dashboardStatus");
const bookingForm = document.getElementById("bookingForm");
const bookingStatus = document.getElementById("bookingStatus");
const bookingTableBody = document.getElementById("bookingTableBody");
const refreshBookings = document.getElementById("refreshBookings");
const stadiumSelect = document.getElementById("stadiumId");
const stadiumFormFields = {
    matchTitle: document.getElementById("matchTitle"),
    bookingDate: document.getElementById("bookingDate"),
    startTime: document.getElementById("startTime"),
    endTime: document.getElementById("endTime"),
    attendees: document.getElementById("attendees")
};

const API_BASE = "/api";
let stadiums = [];
let bookings = [];
let currentUser = null;

if (!token) {
    window.location.href = "user-login.html";
}

if (rawUser) {
    try {
        currentUser = JSON.parse(rawUser);
        userNameEl.textContent = currentUser.fullName || currentUser.email || "Player";
        userEmailEl.textContent = currentUser.email || "";
    } catch (error) {
        currentUser = null;
    }
}

function authHeaders(includeJson = true) {
    const headers = { Authorization: `Bearer ${token}` };
    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }
    return headers;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function setStatus(message, type = "") {
    dashboardStatus.textContent = message;
    dashboardStatus.className = "";
    if (type) {
        dashboardStatus.classList.add(type);
    }
}

function setBookingMessage(message, type = "") {
    bookingStatus.textContent = message;
    bookingStatus.className = "message";
    if (type) {
        bookingStatus.classList.add(type);
    }
}

function formatTimeRange(startTime, endTime) {
    if (!startTime && !endTime) {
        return "-";
    }

    return `${startTime || "--:--"} - ${endTime || "--:--"}`;
}

function renderStadiumOptions(items) {
    stadiumSelect.innerHTML = items.length
        ? items.map((stadium) => `<option value="${stadium.id}">${escapeHtml(stadium.name)} - ${escapeHtml(stadium.city)}</option>`).join("")
        : `<option value="">No stadiums available</option>`;
}

function renderStadiumGrid(items) {
    if (!items.length) {
        stadiumGrid.innerHTML = '<div class="empty-state">No available stadiums right now.</div>';
        return;
    }

    stadiumGrid.innerHTML = items.map((stadium) => `
        <article class="stadium-card">
            <h3>${escapeHtml(stadium.name)}</h3>
            <div class="stadium-meta">
                <span><strong>City:</strong> ${escapeHtml(stadium.city || "-")}</span>
                <span><strong>Location:</strong> ${escapeHtml(stadium.location || "-")}</span>
                <span><strong>Capacity:</strong> ${escapeHtml(stadium.capacity ?? "-")}</span>
            </div>
            <div class="stadium-footer">
                <span class="chip ${stadium.available ? "available" : "unavailable"}">${stadium.available ? "Available" : "Unavailable"}</span>
                <button type="button" class="btn secondary" data-pick-stadium="${stadium.id}">Book</button>
            </div>
        </article>
    `).join("");
}

function renderBookings(items) {
    if (!items.length) {
        bookingTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No bookings yet.</td></tr>';
        bookingCount.textContent = "0";
        upcomingCount.textContent = "0";
        return;
    }

    const upcoming = items.filter((booking) => booking.status !== "CANCELLED").length;
    bookingCount.textContent = String(items.length);
    upcomingCount.textContent = String(upcoming);

    bookingTableBody.innerHTML = items.map((booking) => `
        <tr>
            <td>${escapeHtml(booking.matchTitle || "-")}</td>
            <td>${escapeHtml(getStadiumName(booking.stadiumId))}</td>
            <td>${escapeHtml(booking.bookingDate || "-")}</td>
            <td>${escapeHtml(formatTimeRange(booking.startTime, booking.endTime))}</td>
            <td>${escapeHtml(booking.attendees ?? "-")}</td>
            <td>
                <div class="row-actions">
                    <span class="chip ${booking.status === "CONFIRMED" ? "available" : "unavailable"}">${escapeHtml(booking.status || "-")}</span>
                    <button type="button" class="cancel" data-cancel-booking="${booking.id}">Cancel</button>
                </div>
            </td>
        </tr>
    `).join("");
}

function getStadiumName(stadiumId) {
    const stadium = stadiums.find((item) => String(item.id) === String(stadiumId));
    return stadium ? stadium.name : `Stadium #${stadiumId}`;
}

async function loadStadiums() {
    try {
        setStatus("Loading stadiums...");
        const response = await fetch(`${API_BASE}/stadiums/available`, { headers: authHeaders(false) });
        if (response.status === 401 || response.status === 403) {
            window.location.href = "user-login.html";
            return;
        }
        const data = await response.json().catch(() => []);
        stadiums = Array.isArray(data) ? data : [];
        availableCount.textContent = String(stadiums.length);
        renderStadiumOptions(stadiums);
        renderStadiumGrid(applySearchFilter(stadiums));
        setStatus("Dashboard ready.");
    } catch (error) {
        stadiumGrid.innerHTML = '<div class="empty-state">Unable to load stadiums.</div>';
        setStatus("Unable to load stadiums.", "error");
    }
}

function applySearchFilter(items) {
    const query = stadiumSearch.value.trim().toLowerCase();
    if (!query) {
        return items;
    }

    return items.filter((stadium) =>
        [stadium.name, stadium.city, stadium.location]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
    );
}

async function loadBookings() {
    if (!currentUser?.userId) {
        bookingTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Login again to load your bookings.</td></tr>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/bookings?userId=${currentUser.userId}`, {
            headers: authHeaders(false)
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "user-login.html";
            return;
        }

        const data = await response.json().catch(() => []);
        bookings = Array.isArray(data) ? data : [];
        renderBookings(bookings);
    } catch (error) {
        bookingTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Unable to load bookings.</td></tr>';
    }
}

async function createBooking(event) {
    event.preventDefault();

    if (!currentUser?.userId) {
        setBookingMessage("You need to sign in again.", "error");
        return;
    }

    const payload = {
        userId: currentUser.userId,
        stadiumId: Number(stadiumSelect.value),
        matchTitle: stadiumFormFields.matchTitle.value.trim(),
        bookingDate: stadiumFormFields.bookingDate.value,
        startTime: stadiumFormFields.startTime.value,
        endTime: stadiumFormFields.endTime.value,
        attendees: Number(stadiumFormFields.attendees.value),
        status: "PENDING"
    };

    if (!payload.stadiumId || !payload.matchTitle || !payload.bookingDate || !payload.startTime || !payload.endTime || !payload.attendees) {
        setBookingMessage("Please complete all booking fields.", "error");
        return;
    }

    try {
        setBookingMessage("Creating booking...");
        const response = await fetch(`${API_BASE}/bookings`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401 || response.status === 403) {
            window.location.href = "user-login.html";
            return;
        }

        if (!response.ok) {
            setBookingMessage(data.message || data.error || String(data) || "Unable to create booking.", "error");
            return;
        }

        bookingForm.reset();
        setBookingMessage("Booking created successfully.", "success");
        await loadBookings();
    } catch (error) {
        setBookingMessage("Unable to create booking.", "error");
    }
}

async function cancelBooking(bookingId) {
    const confirmed = window.confirm("Cancel this booking?");
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
            method: "DELETE",
            headers: authHeaders(false)
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "user-login.html";
            return;
        }

        if (!response.ok) {
            setBookingMessage("Unable to cancel booking.", "error");
            return;
        }

        setBookingMessage("Booking cancelled.", "success");
        await loadBookings();
    } catch (error) {
        setBookingMessage("Unable to cancel booking.", "error");
    }
}

stadiumSearch.addEventListener("input", () => {
    renderStadiumGrid(applySearchFilter(stadiums));
});

refreshStadiums.addEventListener("click", loadStadiums);
refreshBookings.addEventListener("click", loadBookings);
bookingForm.addEventListener("submit", createBooking);
logoutLink.addEventListener("click", () => {
    localStorage.removeItem("footbook.token");
    localStorage.removeItem("footbook.user");
    sessionStorage.removeItem("footbook.token");
    sessionStorage.removeItem("footbook.user");
});

stadiumGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-pick-stadium]");
    if (!button) {
        return;
    }

    stadiumSelect.value = button.dataset.pickStadium;
    document.getElementById("booking").scrollIntoView({ behavior: "smooth", block: "start" });
});

bookingTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-cancel-booking]");
    if (!button) {
        return;
    }

    cancelBooking(button.dataset.cancelBooking);
});

loadStadiums();
loadBookings();
