
document.querySelector("form").addEventListener("submit", function(e) {
  e.preventDefault();
  const usernameOrEmail = this.querySelector("input[placeholder='Username or Email']").value;
  const password = this.querySelector("input[placeholder='Password']").value;

  let users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password);

  if (!user) {
    alert("Invalid login credentials!");
    return;
  }

  localStorage.setItem("loggedInUser", JSON.stringify(user));
  alert("Login successful!");
  window.location.href = "book-list.html";
});
