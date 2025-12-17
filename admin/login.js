document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("error");

  try {
    const res = await fetch("https://bbbackend-bng2.onrender.com/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    console.log("LOGIN RESPONSE:", data); 

    if (!res.ok || !data.token) {
      error.innerText = data.message || "Login failed";
      return;
    }

    // ✅ SAVE TOKEN (IMPORTANT)
    localStorage.setItem("adminToken", data.token);

    // ✅ REDIRECT
    window.location.href = "index.html";

  } catch (err) {
    error.innerText = "Server error";
  }
});
