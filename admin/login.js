const form = document.getElementById("adminLoginForm");
const errorText = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch("https://bbbackend-bng2.onrender.com/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorText.textContent = data.message || "Login failed";
      return;
    }

    // 🔐 SAVE ADMIN TOKEN (VERY IMPORTANT)
    localStorage.setItem("adminToken", data.token);

    // OPTIONAL: store admin info
    localStorage.setItem("adminInfo", JSON.stringify(data.admin));

    // REDIRECT TO ADMIN DASHBOARD
    window.location.href = "admin.html";

  } catch (err) {
    errorText.textContent = "Server error. Try again later.";
  }
});
