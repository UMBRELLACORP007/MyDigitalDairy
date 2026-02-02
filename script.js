// Storage keys
const USERS_KEY = "mdd_users";
const CURRENT_USER_KEY = "mdd_current_user";
const THEME_KEY = "theme";

const oldUserList = document.getElementById("oldUserList");
const themeToggle = document.getElementById("themeToggle");

const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginPanel = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");

const regUsername = document.getElementById("regUsername");
const regPassword = document.getElementById("regPassword");
const regConfirm = document.getElementById("regConfirm");
const registerBtn = document.getElementById("registerBtn");
const regMsg = document.getElementById("regMsg");

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function findUser(username) {
  const users = getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

function applyTheme() {
  const t = localStorage.getItem(THEME_KEY) || "light";
  document.body.classList.toggle("dark", t === "dark");
  themeToggle.textContent = (t === "dark") ? "☀️ Light Mode" : "🌙 Dark Mode";
}
applyTheme();

themeToggle.addEventListener("click", () => {
  const current = localStorage.getItem(THEME_KEY) || "light";
  localStorage.setItem(THEME_KEY, current === "dark" ? "light" : "dark");
  applyTheme();
});

function showAccounts() {
  const users = getUsers();
  oldUserList.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.username;
    li.onclick = () => {
      loginUsername.value = u.username;
      switchTo("login");
    };
    oldUserList.appendChild(li);
  });
}
showAccounts();

function switchTo(mode) {
  if (mode === "login") {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginPanel.classList.remove("hidden");
    registerPanel.classList.add("hidden");
    loginMsg.textContent = "";
    regMsg.textContent = "";
  } else {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerPanel.classList.remove("hidden");
    loginPanel.classList.add("hidden");
    loginMsg.textContent = "";
    regMsg.textContent = "";
  }
}
tabLogin.onclick = () => switchTo("login");
tabRegister.onclick = () => switchTo("register");

// Auto redirect if already logged in
const currentUser = localStorage.getItem(CURRENT_USER_KEY);
if (currentUser) {
  window.location.href = "dashboard/dashboard.html";
}

// REGISTER
registerBtn.addEventListener("click", () => {
  const username = regUsername.value.trim();
  const pass = regPassword.value.trim();
  const confirm = regConfirm.value.trim();

  regMsg.textContent = "";

  if (username.length < 3) { regMsg.textContent = "Username must be at least 3 characters."; return; }
  if (pass.length < 4) { regMsg.textContent = "Password must be at least 4 characters."; return; }
  if (pass !== confirm) { regMsg.textContent = "Passwords do not match."; return; }
  if (findUser(username)) { regMsg.textContent = "Username already exists."; return; }

  const users = getUsers();
  users.push({ username, password: pass }); // local-only demo
  setUsers(users);

  showAccounts();
  regMsg.textContent = "Account created ✅ Now login.";
  regUsername.value = "";
  regPassword.value = "";
  regConfirm.value = "";
  switchTo("login");
});

// LOGIN
loginBtn.addEventListener("click", () => {
  const username = loginUsername.value.trim();
  const pass = loginPassword.value.trim();

  loginMsg.textContent = "";

  const user = findUser(username);
  if (!user) { loginMsg.textContent = "Account not found. Please register."; return; }
  if (user.password !== pass) { loginMsg.textContent = "Wrong password."; return; }

  localStorage.setItem(CURRENT_USER_KEY, user.username);
  localStorage.setItem("currentUser", user.username); // (compat key if you used earlier)

  window.location.href = "dashboard/dashboard.html";
});
