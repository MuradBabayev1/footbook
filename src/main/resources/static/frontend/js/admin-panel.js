const token = localStorage.getItem("footbook.token") || sessionStorage.getItem("footbook.token");
const rawUser = localStorage.getItem("footbook.user") || sessionStorage.getItem("footbook.user");
const sessionInfo = document.getElementById("sessionInfo");
const logoutLink = document.querySelector('a[href="login.html"]');

if (!token) {
    window.location.href = "login.html";
}

if (rawUser && sessionInfo) {
    try {
        const user = JSON.parse(rawUser);
        const name = user.fullName || user.email || "Admin";
        sessionInfo.textContent = `Signed in: ${name}`;
    } catch (error) {
        sessionInfo.textContent = "Live mode: Active";
    }
}

if (logoutLink) {
    logoutLink.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("footbook.token");
        localStorage.removeItem("footbook.user");
        sessionStorage.removeItem("footbook.token");
        sessionStorage.removeItem("footbook.user");
        window.location.href = "login.html";
    });
}
