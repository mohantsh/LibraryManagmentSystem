
document.querySelector("form").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = this.querySelector("input[placeholder='Username']").value;
  const email = this.querySelector("input[placeholder='Email']").value;
  const password = this.querySelector("input[placeholder='Password']").value;
  const confirm = this.querySelector("input[placeholder='Confirm Password']").value;
  const role = this.querySelector("input[name='role']:checked").value;

  if (password !== confirm) {
    alert("Passwords do not match!");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users") || "[]");
  if (users.find(u => u.username === username || u.email === email)) {
    alert("User already exists!");
    return;
  }

  users.push({ username, email, password, role });
  localStorage.setItem("users", JSON.stringify(users));
  alert("Signup successful!");
  window.location.href = "login.html";
});
