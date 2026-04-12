const token = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
const rawUser = localStorage.getItem("footbook.user") || sessionStorage.getItem("footbook.user");

const ownerInfo = document.getElementById("ownerInfo");
const logoutLink = document.getElementById("logoutLink");
const form = document.getElementById("stadiumForm");
const formStatus = document.getElementById("formStatus");
const resetFormBtn = document.getElementById("resetFormBtn");
const refreshBtn = document.getElementById("refreshBtn");
const tableBody = document.getElementById("stadiumTableBody");
const formTitle = document.getElementById("formTitle");
const saveBtn = document.getElementById("saveBtn");
const totalStadiumsEl = document.getElementById("totalStadiums");
const availableStadiumsEl = document.getElementById("availableStadiums");
const unavailableStadiumsEl = document.getElementById("unavailableStadiums");

const fieldRefs = {
    id: document.getElementById("stadiumId"),
    name: document.getElementById("name"),
    city: document.getElementById("city"),
    location: document.getElementById("location"),
    capacity: document.getElementById("capacity"),
    available: document.getElementById("available")
};

let currentUser = null;
let myStadiums = [];

if (!token) {
    window.location.href = "user-login.html";
}

if (rawUser) {
    try {
        currentUser = JSON.parse(rawUser);
    } catch (error) {
        currentUser = null;
    }
}

const role = String(currentUser?.role || "").toUpperCase();
if (role !== "OWNER") {
    window.location.href = "user-dashboard.html";
}

document.body.classList.add("auth-ready");

if (ownerInfo && currentUser) {
    ownerInfo.textContent = `Signed in as ${currentUser.fullName || currentUser.email || "Owner"}`;
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

function setFormStatus(message, type = "") {
    formStatus.textContent = message;
    formStatus.className = "status";
    if (type) {
        formStatus.classList.add(type);
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function updateStats(items) {
    const total = items.length;
    const available = items.filter((item) => item.available).length;
    totalStadiumsEl.textContent = String(total);
    availableStadiumsEl.textContent = String(available);
    unavailableStadiumsEl.textContent = String(total - available);
}

function resetForm() {
    fieldRefs.id.value = "";
    fieldRefs.name.value = "";
    fieldRefs.city.value = "";
    fieldRefs.location.value = "";
    fieldRefs.capacity.value = "";
    fieldRefs.available.value = "true";
    formTitle.textContent = "Add New Stadium";
    saveBtn.textContent = "Create Stadium";
    setFormStatus("");
}

function startEdit(stadiumId) {
    const stadium = myStadiums.find((item) => String(item.id) === String(stadiumId));
    if (!stadium) {
        return;
    }

    fieldRefs.id.value = stadium.id;
    fieldRefs.name.value = stadium.name || "";
    fieldRefs.city.value = stadium.city || "";
    fieldRefs.location.value = stadium.location || "";
    fieldRefs.capacity.value = stadium.capacity ?? "";
    fieldRefs.available.value = String(Boolean(stadium.available));

    formTitle.textContent = "Update Stadium";
    saveBtn.textContent = "Update Stadium";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderStadiums(items) {
    if (!items.length) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty">No stadiums yet. Add your first stadium.</td></tr>';
        return;
    }

    tableBody.innerHTML = items.map((stadium) => `
        <tr>
            <td>${escapeHtml(stadium.name || "-")}</td>
            <td>${escapeHtml(stadium.city || "-")}</td>
            <td>${escapeHtml(stadium.location || "-")}</td>
            <td>${escapeHtml(stadium.capacity ?? "-")}</td>
            <td><span class="pill ${stadium.available ? "available" : "unavailable"}">${stadium.available ? "Available" : "Unavailable"}</span></td>
            <td>
                <div class="row-actions">
                    <button type="button" class="edit" data-action="edit" data-id="${stadium.id}">Edit</button>
                    <button type="button" class="delete" data-action="delete" data-id="${stadium.id}">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");
}

async function loadMyStadiums() {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty">Loading stadiums...</td></tr>';
    try {
        const response = await fetch("/api/stadiums/owner/mine", {
            headers: authHeaders(false)
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "user-login.html";
            return;
        }

        if (!response.ok) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty">Unable to load stadiums.</td></tr>';
            return;
        }

        const data = await response.json().catch(() => []);
        myStadiums = Array.isArray(data) ? data : [];
        updateStats(myStadiums);
        renderStadiums(myStadiums);
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty">Unable to load stadiums.</td></tr>';
    }
}

async function saveStadium(event) {
    event.preventDefault();

    const payload = {
        name: fieldRefs.name.value.trim(),
        city: fieldRefs.city.value.trim(),
        location: fieldRefs.location.value.trim(),
        capacity: Number(fieldRefs.capacity.value),
        available: fieldRefs.available.value === "true"
    };

    if (!payload.name || !payload.city || !payload.location || !payload.capacity || payload.capacity <= 0) {
        setFormStatus("Please fill all fields correctly.", "error");
        return;
    }

    const editingId = fieldRefs.id.value;
    const endpoint = editingId ? `/api/stadiums/owner/${editingId}` : "/api/stadiums";
    const method = editingId ? "PUT" : "POST";

    try {
        setFormStatus(editingId ? "Updating stadium..." : "Creating stadium...");
        const response = await fetch(endpoint, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401 || response.status === 403) {
            setFormStatus(data.message || data.error || "Access denied for this action.", "error");
            return;
        }

        if (!response.ok) {
            setFormStatus(data.message || data.error || "Unable to save stadium.", "error");
            return;
        }

        setFormStatus(editingId ? "Stadium updated successfully." : "Stadium created successfully.", "ok");
        resetForm();
        await loadMyStadiums();
    } catch (error) {
        setFormStatus("Unable to save stadium right now.", "error");
    }
}

async function removeStadium(stadiumId) {
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
            setFormStatus("You are not allowed to delete this stadium.", "error");
            return;
        }

        if (!response.ok) {
            setFormStatus("Unable to delete stadium.", "error");
            return;
        }

        setFormStatus("Stadium deleted.", "ok");
        await loadMyStadiums();
    } catch (error) {
        setFormStatus("Unable to delete stadium.", "error");
    }
}

logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    localStorage.removeItem("footbook.token");
    localStorage.removeItem("footbook.user");
    sessionStorage.removeItem("footbook.token");
    sessionStorage.removeItem("footbook.user");
    window.location.href = "index.html";
});

form.addEventListener("submit", saveStadium);
resetFormBtn.addEventListener("click", resetForm);
refreshBtn.addEventListener("click", loadMyStadiums);

tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
        return;
    }

    const stadiumId = button.dataset.id;
    if (button.dataset.action === "edit") {
        startEdit(stadiumId);
        return;
    }
    if (button.dataset.action === "delete") {
        removeStadium(stadiumId);
    }
});

loadMyStadiums();
