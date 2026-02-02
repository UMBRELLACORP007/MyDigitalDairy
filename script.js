// SELECT ELEMENTS
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const oldUserList = document.getElementById("oldUserList");

// GET USERS (ONLY STRINGS)
let users = JSON.parse(localStorage.getItem("users")) || [];

// SAFETY CHECK (remove non-string values)
users = users.filter(user => typeof user === "string");

// SHOW OLD USERS
function showOldUsers() {
  oldUserList.innerHTML = "";

  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;

    li.addEventListener("click", () => {
      usernameInput.value = user;
    });

    oldUserList.appendChild(li);
  });
}

showOldUsers();

// LOGIN BUTTON
loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username === "" || password === "") {
    alert("Please enter username and password");
    return;
  }

  if (!users.includes(username)) {
    users.push(username);
    localStorage.setItem("users", JSON.stringify(users));
  }

  localStorage.setItem("currentUser", username);

 window.location.href = "dashboard/dashboard.html";

});