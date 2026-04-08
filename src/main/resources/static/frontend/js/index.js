const authToken = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
const primaryAction = document.getElementById("primary-cta");
const secondaryAction = document.getElementById("secondary-cta");

if (authToken && primaryAction && secondaryAction) {
	primaryAction.textContent = "Go to admin panel";
	primaryAction.href = "admin-panel.html";
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
