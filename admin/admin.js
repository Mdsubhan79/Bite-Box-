/* ========= CONFIG ========= */
const API_BASE = "https://bbbackend-bng2.onrender.com";

/* ========= AUTH CHECK ========= */
if (!localStorage.getItem("adminToken")) {
  window.location.href = "login.html";
}

/* ========= PAGE NAVIGATION ========= */
function loadPage(page) {
  const content = document.getElementById("content");

  switch (page) {
    case "dashboard":
      loadDashboard();
      break;

    case "veg":
      loadVegMenu();
      break;

    case "nonveg":
        loadNonVegMenu();
      break;

    case "tiffin":
       loadTiffins();
      break;

    case "orders":
       loadOrders();
      break;

    case "users":
      loadUsers();
      break;

    case "settings":
      content.innerHTML = `
        <h2>Admin Settings</h2>
        <button onclick="logoutAdmin()">Logout</button>
      `;
      break;

    default:
      content.innerHTML = "<h2>Welcome Admin</h2>";
  }
}

/* ========= DASHBOARD OVERVIEW ========= */
function loadDashboard() {
  const content = document.getElementById("content");

  content.innerHTML = "<h2>Loading dashboard...</h2>";

  fetch(`${API_BASE}/api/admin/dashboard-stats`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  })
  .then(data => {
    content.innerHTML = `
      <h2>Dashboard Overview</h2>

      <div class="cards">
        <div class="card">Total Users<br><b>${data.totalUsers}</b></div>
        <div class="card">Today Orders<br><b>${data.todayOrders}</b></div>
        <div class="card">Veg Items<br><b>${data.vegItems}</b></div>
        <div class="card">Non-Veg Items<br><b>${data.nonVegItems}</b></div>
        <div class="card">Active Tiffins<br><b>${data.activeTiffins}</b></div>
        <div class="card">Today Revenue<br><b>₹${data.todayRevenue}</b></div>
      </div>
    `;
  })
  .catch(() => {
    content.innerHTML = "<p>Session expired. Please login again.</p>";
    logoutAdmin();
  });
}

/* ========= VEG MENU MANAGEMENT ========= */
function loadVegMenu() {
  const content = document.getElementById("content");

  content.innerHTML = "<h2>Loading Veg Menu...</h2>";

  fetch(`${API_BASE}/api/admin/menu?type=veg`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => res.json())
  .then(items => {
    let html = `
      <h2>Veg Menu Management</h2>
      <button onclick="showAddVegForm()">+ Add Veg Item</button>

      <table>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Available</th>
          <th>Actions</th>
        </tr>
    `;

    items.forEach(item => {
      html += `
        <tr>
          <td>${item.name}</td>
          <td>₹${item.price}</td>
          <td>${item.available ? "Yes" : "No"}</td>
          <td>
            <button onclick="deleteVeg('${item._id}')">Delete</button>
          </td>
        </tr>
      `;
    });

    html += "</table>";
    content.innerHTML = html;
  });
}

/* ========= ADD VEG ITEM ========= */
function showAddVegForm() {
  document.getElementById("content").innerHTML = `
    <h2>Add Veg Item</h2>

    <input id="vegName" placeholder="Item Name">
    <input id="vegPrice" type="number" placeholder="Price">

    <button onclick="addVeg()">Save</button>
    <button onclick="loadVegMenu()">Cancel</button>
  `;
}

function addVeg() {
  fetch(`${API_BASE}/api/admin/menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({
      name: document.getElementById("vegName").value,
      price: document.getElementById("vegPrice").value,
      type: "veg"
    })
  })
  .then(() => loadVegMenu());
}

/* ========= DELETE VEG ========= */
function deleteVeg(id) {
  if (!confirm("Delete this item?")) return;

  fetch(`${API_BASE}/api/admin/menu/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(() => loadVegMenu());
}

/* ========= LOGOUT ========= */
function logoutAdmin() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

/* ========= AUTO LOAD ========= */
window.onload = () => {
  loadPage("dashboard");
};
/* ========= ADD NON-VEG ITEM ========= */
function loadNonVegMenu() {
  const content = document.getElementById("content");

  content.innerHTML = "<h2>Loading Non-Veg Menu...</h2>";

  fetch(`${API_BASE}/api/admin/menu?type=nonveg`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => res.json())
  .then(items => {
    let html = `
      <h2>Non-Veg Menu Management</h2>
      <button onclick="showAddNonVegForm()">+ Add Non-Veg Item</button>

      <table>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Available</th>
          <th>Actions</th>
        </tr>
    `;

    items.forEach(item => {
      html += `
        <tr>
          <td>${item.name}</td>
          <td>₹${item.price}</td>
          <td>${item.available ? "Yes" : "No"}</td>
          <td>
            <button onclick="deleteNonVeg('${item._id}')">Delete</button>
          </td>
        </tr>
      `;
    });

    html += "</table>";
    content.innerHTML = html;
  });
}
function showAddNonVegForm() {
  document.getElementById("content").innerHTML = `
    <h2>Add Non-Veg Item</h2>

    <input id="nonvegName" placeholder="Item Name">
    <input id="nonvegPrice" type="number" placeholder="Price">

    <button onclick="addNonVeg()">Save</button>
    <button onclick="loadNonVegMenu()">Cancel</button>
  `;
}
function addNonVeg() {
  fetch(`${API_BASE}/api/admin/menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({
      name: document.getElementById("nonvegName").value,
      price: document.getElementById("nonvegPrice").value,
      type: "nonveg"
    })
  })
  .then(() => loadNonVegMenu());
}
function deleteNonVeg(id) {
  if (!confirm("Delete this item?")) return;

  fetch(`${API_BASE}/api/admin/menu/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(() => loadNonVegMenu());
}



/* ========= TIFFIN MANAGEMENT ========= */
function loadTiffins() {
  const content = document.getElementById("content");
  content.innerHTML = "<h2>Loading Tiffin Plans...</h2>";

  fetch(`${API_BASE}/api/admin/tiffins`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => res.json())
  .then(tiffins => {
    let html = `
      <h2>Tiffin Services</h2>
      <button onclick="showAddTiffinForm()">+ Add Tiffin Plan</button>

      <table>
        <tr>
          <th>Plan</th>
          <th>Type</th>
          <th>Price</th>
          <th>Meals</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
    `;

    tiffins.forEach(t => {
      html += `
        <tr>
          <td>${t.planName}</td>
          <td>${t.type}</td>
          <td>₹${t.price}</td>
          <td>${t.meals.join(", ")}</td>
          <td>${t.active ? "Active" : "Inactive"}</td>
          <td>
  <button onclick="editTiffin('${t._id}')">Edit</button>
  <button onclick="deleteTiffin('${t._id}')">Delete</button>
</td>

        </tr>
      `;
    });

    html += "</table>";
    content.innerHTML = html;
  });
}

/* ========= ADD TIFFIN FORM ========= */
function showAddTiffinForm() {
  document.getElementById("content").innerHTML = `
    <h2>Add Tiffin Plan</h2>

    <input id="planName" placeholder="Plan Name">
    <select id="type">
      <option value="veg">Veg</option>
      <option value="nonveg">Non-Veg</option>
    </select>
    <input id="price" type="number" placeholder="Monthly Price">
    <input id="meals" placeholder="Meals (comma separated)">
    
    <button onclick="addTiffin()">Save</button>
    <button onclick="loadTiffins()">Cancel</button>
  `;
}

function addTiffin() {
  fetch(`${API_BASE}/api/admin/tiffins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({
      planName: document.getElementById("planName").value,
      type: document.getElementById("type").value,
      price: document.getElementById("price").value,
      meals: document.getElementById("meals").value.split(",")
    })
  })
  .then(() => loadTiffins());
}

/* ========= DELETE TIFFIN ========= */
function deleteTiffin(id) {
  if (!confirm("Delete this tiffin plan?")) return;

  fetch(`${API_BASE}/api/admin/tiffins/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(() => loadTiffins());
}


function editTiffin(id) {
  fetch(`${API_BASE}/api/admin/tiffins`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => res.json())
  .then(tiffins => {
    const t = tiffins.find(x => x._id === id);

    document.getElementById("content").innerHTML = `
      <h2>Edit Tiffin Plan</h2>

      <input id="planName" value="${t.planName}" disabled>

      <select id="type">
        <option value="veg" ${t.type === "veg" ? "selected" : ""}>Veg</option>
        <option value="nonveg" ${t.type === "nonveg" ? "selected" : ""}>Non-Veg</option>
      </select>

      <input id="price" type="number" value="${t.price}">
      <input id="meals" value="${t.meals.join(", ")}">

      <label>
        <input type="checkbox" id="active" ${t.active ? "checked" : ""}>
        Active
      </label>

      <br><br>
      <button onclick="updateTiffin('${id}')">Update</button>
      <button onclick="loadTiffins()">Cancel</button>
    `;
  });
}
/* ================= UPDATE TIFFIN ================= */
router.put("/tiffins/:id", adminAuth, async (req, res) => {
  try {
    const { type, price, meals, active } = req.body;

    const tiffin = await Tiffin.findByIdAndUpdate(
      req.params.id,
      { type, price, meals, active },
      { new: true }
    );

    res.json(tiffin);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// load tiffins
function loadTiffins() {  }

// show add tiffin form
function showAddTiffinForm() {  }

// add tiffin
function addTiffin() {  }

// delete tiffin
function deleteTiffin(id) {  }

// ✅ ADD HERE
function updateTiffin(id) {
  fetch(`${API_BASE}/api/admin/tiffins/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({
      type: document.getElementById("type").value,
      price: document.getElementById("price").value,
      meals: document.getElementById("meals").value.split(","),
      active: document.getElementById("active").checked
    })
  })
  .then(() => loadTiffins());
}
/* ========= UPDATE TIFFIN ========= */
function updateTiffin(id) {
  fetch(`${API_BASE}/api/admin/tiffins/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({
      type: document.getElementById("type").value,
      price: document.getElementById("price").value,
      meals: document.getElementById("meals").value.split(","),
      active: document.getElementById("active").checked
    })
  })
  .then(() => loadTiffins());
}

/* ========= USERS LIST ========= */
function loadUsers() {
  const content = document.getElementById("content");
  content.innerHTML = "<h2>Loading users...</h2>";

  fetch(`${API_BASE}/api/admin/users`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  })
  .then(users => {
    let html = `
      <h2>Users List</h2>
      <table>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Joined</th>
        </tr>
    `;

    users.forEach(user => {
      html += `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        </tr>
      `;
    });

    html += "</table>";
    content.innerHTML = html;
  })
  .catch(() => {
    content.innerHTML = "<p>Session expired. Please login again.</p>";
    logoutAdmin();
  });
}


/* ========= ORDERS MANAGEMENT ========= */
function loadOrders() {
  const content = document.getElementById("content");
  content.innerHTML = "<h2>Loading orders...</h2>";

  fetch(`${API_BASE}/api/admin/orders`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  })
  .then(orders => {
    let html = `
      <h2>Orders</h2>
      <table>
        <tr>
          <th>User</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
    `;

    orders.forEach(order => {
      html += `
        <tr>
          <td>${order.user?.name || "Guest"}</td>
          <td>₹${order.totalAmount}</td>
          <td>
            <select onchange="updateOrderStatus('${order._id}', this.value)">
              <option ${order.status === "pending" ? "selected" : ""}>pending</option>
              <option ${order.status === "confirmed" ? "selected" : ""}>confirmed</option>
              <option ${order.status === "delivered" ? "selected" : ""}>delivered</option>
              <option ${order.status === "cancelled" ? "selected" : ""}>cancelled</option>
            </select>
          </td>
          <td>${new Date(order.createdAt).toLocaleString()}</td>
          <td>✔</td>
        </tr>
      `;
    });

    html += "</table>";
    content.innerHTML = html;
  })
  .catch(() => {
    content.innerHTML = "<p>Session expired. Please login again.</p>";
    logoutAdmin();
  });
}
function updateOrderStatus(id, status) {
  fetch(`${API_BASE}/api/admin/orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({ status })
  })
  .then(() => loadOrders());
}
