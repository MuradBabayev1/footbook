const authToken = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
const rawUser = localStorage.getItem("footbook.user") || sessionStorage.getItem("footbook.user");
const primaryAction = document.getElementById("primary-cta");
const secondaryAction = document.getElementById("secondary-cta");

if (authToken && primaryAction && secondaryAction) {
	let role = "USER";
	try {
		role = String(JSON.parse(rawUser || "{}").role || "USER").toUpperCase();
	} catch (error) {
		role = "USER";
	}

	if (role === "ADMIN") {
		primaryAction.textContent = "Go to admin panel";
		primaryAction.href = "admin-panel.html";
	} else if (role === "OWNER") {
		primaryAction.textContent = "Go to owner panel";
		primaryAction.href = "owner-dashboard.html";
	} else {
		primaryAction.textContent = "Go to player dashboard";
		primaryAction.href = "user-dashboard.html";
	}
	secondaryAction.textContent = "Logout";
	secondaryAction.href = "index.html";
	secondaryAction.addEventListener("click", (event) => {
		event.preventDefault();
		localStorage.removeItem("footbook.token");
		localStorage.removeItem("footbook.user");
		sessionStorage.removeItem("footbook.token");
		sessionStorage.removeItem("footbook.user");
		window.location.href = "index.html";
	});
}
