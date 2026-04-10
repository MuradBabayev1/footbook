const token = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
const rawUser = localStorage.getItem("footbook.user") || sessionStorage.getItem("footbook.user");
const sessionInfo = document.getElementById("sessionInfo");
const logoutLink = document.getElementById("adminLogoutLink");
const addStadiumBtn = document.getElementById("addStadiumBtn");
const refreshStadiumBtn = document.getElementById("refreshStadiumBtn");
const cancelStadiumBtn = document.getElementById("cancelStadiumBtn");
const stadiumForm = document.getElementById("stadiumForm");
const stadiumStatus = document.getElementById("stadiumStatus");
const stadiumTableBody = document.getElementById("stadiumTableBody");
const stadiumIdInput = document.getElementById("stadiumId");
const saveStadiumBtn = document.getElementById("saveStadiumBtn");
const refreshUsersBtn = document.getElementById("refreshUsersBtn");
const usersTableBody = document.getElementById("usersTableBody");
const totalBookingsCount = document.getElementById("totalBookingsCount");
const pendingBookingsCount = document.getElementById("pendingBookingsCount");
const totalUsersCount = document.getElementById("totalUsersCount");
const cancelledBookingsCount = document.getElementById("cancelledBookingsCount");
const stadiumFormFields = {
    name: document.getElementById("name"),
    city: document.getElementById("city"),
    location: document.getElementById("location"),
    capacity: document.getElementById("capacity"),
    available: document.getElementById("available")
};

const API_BASE = "/api/stadiums";
const USERS_API_BASE = "/api/users";
const BOOKINGS_API_BASE = "/api/bookings";

if (!token) {
    window.location.href = "login.html";
}

if (rawUser && sessionInfo) {
    try {
        const user = JSON.parse(rawUser);
        const role = String(user.role || "").toUpperCase();
        if (role !== "ADMIN") {
            localStorage.removeItem("footbook.token");
            localStorage.removeItem("footbook.user");
            sessionStorage.removeItem("footbook.token");
            sessionStorage.removeItem("footbook.user");
            window.location.href = "login.html";
        }
        const name = user.fullName || user.email || "Admin";
        sessionInfo.textContent = `Signed in: ${name}`;
    } catch (error) {
        sessionInfo.textContent = "Live mode: Active";
        localStorage.removeItem("footbook.token");
        localStorage.removeItem("footbook.user");
        sessionStorage.removeItem("footbook.token");
        sessionStorage.removeItem("footbook.user");
        window.location.href = "login.html";
    }
} else {
    window.location.href = "login.html";
}

if (logoutLink) {
    logoutLink.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("footbook.token");
        localStorage.removeItem("footbook.user");
        sessionStorage.removeItem("footbook.token");
        sessionStorage.removeItem("footbook.user");
        window.location.href = "index.html";
    });
}

function authHeaders(includeJson = true) {
    const headers = {
        Authorization: `Bearer ${token}`
    };

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function setStadiumStatus(message, type = "") {
    if (!stadiumStatus) {
        return;
    }

    stadiumStatus.className = `status-message${type ? ` ${type}` : ""}`;
    stadiumStatus.textContent = message;
}

function clearStadiumForm() {
    stadiumIdInput.value = "";
    stadiumFormFields.name.value = "";
    stadiumFormFields.city.value = "";
    stadiumFormFields.location.value = "";
    stadiumFormFields.capacity.value = "";
    stadiumFormFields.available.value = "true";
    saveStadiumBtn.textContent = "Save Stadium";
}

function openStadiumForm(stadium = null) {
    stadiumForm.hidden = false;

    if (stadium) {
        stadiumIdInput.value = stadium.id;
        stadiumFormFields.name.value = stadium.name || "";
        stadiumFormFields.city.value = stadium.city || "";
        stadiumFormFields.location.value = stadium.location || "";
        stadiumFormFields.capacity.value = stadium.capacity ?? "";
        stadiumFormFields.available.value = String(Boolean(stadium.available));
        saveStadiumBtn.textContent = "Update Stadium";
    } else {
        clearStadiumForm();
        stadiumForm.hidden = false;
    }

    stadiumForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeStadiumForm() {
    stadiumForm.hidden = true;
    clearStadiumForm();
    setStadiumStatus("");
}

function renderEmptyState(message) {
    stadiumTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">${message}</td></tr>`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderStadiums(stadiums) {
    if (!stadiums.length) {
        renderEmptyState("No stadiums found. Add one to get started.");
        return;
    }

    stadiumTableBody.innerHTML = stadiums.map((stadium) => `
        <tr>
            <td>${escapeHtml(stadium.name || "-")}</td>
            <td>${escapeHtml(stadium.city || "-")}</td>
            <td>${escapeHtml(stadium.location || "-")}</td>
            <td>${escapeHtml(stadium.capacity ?? "-")}</td>
            <td><span class="status ${stadium.available ? "confirmed" : "pending"}">${stadium.available ? "Available" : "Unavailable"}</span></td>
            <td>
                <div class="table-actions">
                    <button type="button" class="edit" data-action="edit" data-id="${stadium.id}">Edit</button>
                    <button type="button" class="delete" data-action="delete" data-id="${stadium.id}">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");
}

function renderUsersEmptyState(message) {
    if (!usersTableBody) {
        return;
    }

    usersTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">${message}</td></tr>`;
}

function renderUsers(users) {
    if (!usersTableBody) {
        return;
    }

    if (!users.length) {
        renderUsersEmptyState("No users found.");
        return;
    }

    usersTableBody.innerHTML = users.map((user) => `
        <tr>
            <td>${escapeHtml(user.id ?? "-")}</td>
            <td>${escapeHtml(user.fullName || "-")}</td>
            <td>${escapeHtml(user.email || "-")}</td>
            <td>${escapeHtml(user.phoneNumber || "-")}</td>
            <td>
                <div class="table-actions">
                    <button type="button" class="delete" data-user-action="delete" data-user-id="${user.id}">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");
}

function setDashboardStat(element, value) {
    if (element) {
        element.textContent = String(value);
    }
}

async function deleteUser(userId) {
    const confirmed = window.confirm("Delete this user? This cannot be undone.");
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${USERS_API_BASE}/${userId}`, {
            method: "DELETE",
            headers: authHeaders(false)
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            setStadiumStatus("Unable to delete user.", "error");
            return;
        }

        setStadiumStatus("User deleted successfully.", "success");
        await loadUsers();
    } catch (error) {
        setStadiumStatus("Unable to delete user right now.", "error");
    }
}

async function loadStadiums() {
    renderEmptyState("Loading stadiums...");

    try {
        const response = await fetch(API_BASE, {
            headers: authHeaders(false)
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            renderEmptyState("Failed to load stadiums.");
            return;
        }

        const stadiums = await response.json();
        renderStadiums(Array.isArray(stadiums) ? stadiums : []);
    } catch (error) {
        renderEmptyState("Unable to reach the server.");
    }
}

async function loadUsers() {
    if (!usersTableBody) {
        return;
    }

    renderUsersEmptyState("Loading users...");

    try {
        const response = await fetch(USERS_API_BASE, {
            headers: authHeaders(false)
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            renderUsersEmptyState("Failed to load users.");
            return;
        }

        const users = await response.json().catch(() => []);
        renderUsers(Array.isArray(users) ? users : []);
    } catch (error) {
        renderUsersEmptyState("Unable to reach the server.");
    }
}

async function loadDashboardStats() {
    try {
        const [bookingsResponse, usersResponse, stadiumsResponse] = await Promise.all([
            fetch(BOOKINGS_API_BASE, { headers: authHeaders(false) }),
            fetch(USERS_API_BASE, { headers: authHeaders(false) }),
            fetch(API_BASE, { headers: authHeaders(false) })
        ]);

        if ([bookingsResponse, usersResponse, stadiumsResponse].some((response) => response.status === 401 || response.status === 403)) {
            window.location.href = "login.html";
            return;
        }

        const bookings = bookingsResponse.ok ? await bookingsResponse.json().catch(() => []) : [];
        const users = usersResponse.ok ? await usersResponse.json().catch(() => []) : [];
        const stadiums = stadiumsResponse.ok ? await stadiumsResponse.json().catch(() => []) : [];

        const safeBookings = Array.isArray(bookings) ? bookings : [];
        const safeUsers = Array.isArray(users) ? users : [];
        const safeStadiums = Array.isArray(stadiums) ? stadiums : [];

        setDashboardStat(totalBookingsCount, safeBookings.length);
        setDashboardStat(pendingBookingsCount, safeBookings.filter((booking) => String(booking.status || "").toUpperCase() === "PENDING").length);
        setDashboardStat(totalUsersCount, safeUsers.length);
        setDashboardStat(cancelledBookingsCount, safeBookings.filter((booking) => String(booking.status || "").toUpperCase() === "CANCELLED").length);

        const statusPill = document.getElementById("sessionInfo");
        if (statusPill) {
            statusPill.textContent = `${safeStadiums.length} stadiums live`;
        }
    } catch (error) {
        setDashboardStat(totalBookingsCount, 0);
        setDashboardStat(pendingBookingsCount, 0);
        setDashboardStat(totalUsersCount, 0);
        setDashboardStat(cancelledBookingsCount, 0);
    }
}

async function saveStadium(event) {
    event.preventDefault();

    const payload = {
        name: stadiumFormFields.name.value.trim(),
        city: stadiumFormFields.city.value.trim(),
        location: stadiumFormFields.location.value.trim(),
        capacity: Number(stadiumFormFields.capacity.value),
        available: stadiumFormFields.available.value === "true"
    };

    if (!payload.name || !payload.city || !payload.location || !payload.capacity) {
        setStadiumStatus("Please complete all stadium fields.", "error");
        return;
    }

    const stadiumId = stadiumIdInput.value;
    const isEditing = Boolean(stadiumId);

    try {
        setStadiumStatus(isEditing ? "Updating stadium..." : "Creating stadium...", "");

        const response = await fetch(isEditing ? `${API_BASE}/${stadiumId}` : API_BASE, {
            method: isEditing ? "PUT" : "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401 || response.status === 403) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            setStadiumStatus(data.message || data.error || String(data) || "Unable to save stadium.", "error");
            return;
        }

        setStadiumStatus(isEditing ? "Stadium updated successfully." : "Stadium added successfully.", "success");
        closeStadiumForm();
        await loadStadiums();
    } catch (error) {
        setStadiumStatus("Unable to save stadium right now.", "error");
    }
}

async function deleteStadium(stadiumId) {
    const confirmed = window.confirm("Delete this stadium?");
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${stadiumId}`, {
            method: "DELETE",
            headers: authHeaders(false)
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            setStadiumStatus("Unable to delete stadium.", "error");
            return;
        }

        setStadiumStatus("Stadium deleted.", "success");
        await loadStadiums();
    } catch (error) {
        setStadiumStatus("Unable to delete stadium right now.", "error");
    }
}

async function handleTableClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
        const userButton = event.target.closest("button[data-user-action]");
        if (!userButton) {
            return;
        }

        if (userButton.dataset.userAction === "delete") {
            await deleteUser(userButton.dataset.userId);
        }
        return;
    }

    const stadiumId = button.dataset.id;
    const action = button.dataset.action;

    if (action === "delete") {
        await deleteStadium(stadiumId);
        return;
    }

    if (action === "edit") {
        try {
            const response = await fetch(`${API_BASE}/${stadiumId}`, {
                headers: authHeaders(false)
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = "login.html";
                return;
            }

            if (!response.ok) {
                setStadiumStatus("Unable to load stadium details.", "error");
                return;
            }

            const stadium = await response.json();
            openStadiumForm(stadium);
            setStadiumStatus(`Editing ${stadium.name}.`, "success");
        } catch (error) {
            setStadiumStatus("Unable to load stadium details.", "error");
        }
    }
}

if (addStadiumBtn) {
    addStadiumBtn.addEventListener("click", () => {
        openStadiumForm();
        setStadiumStatus("Fill in the form to add a new stadium.");
    });
}

if (refreshStadiumBtn) {
    refreshStadiumBtn.addEventListener("click", loadStadiums);
}

if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener("click", loadUsers);
}

if (cancelStadiumBtn) {
    cancelStadiumBtn.addEventListener("click", closeStadiumForm);
}

if (stadiumForm) {
    stadiumForm.addEventListener("submit", saveStadium);
}

if (stadiumTableBody) {
    stadiumTableBody.addEventListener("click", handleTableClick);
}

if (usersTableBody) {
    usersTableBody.addEventListener("click", handleTableClick);
}

loadStadiums();
loadUsers();
loadDashboardStats();
