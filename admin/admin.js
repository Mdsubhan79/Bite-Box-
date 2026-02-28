/* ========= CONFIG ========= */
const API_BASE = "https://bbbackend-bng2.onrender.com";

/* ========= AUTH CHECK ========= */
const token = localStorage.getItem("adminToken");

if (!token || token === "undefined") {
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

    case "tiffinBookings":
  loadTiffinBookings();
  break;
    
    case "defaultMenu":
  loadDefaultMenu();
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
      if (res.status === 401) {
        logoutAdmin();
        throw new Error("Unauthorized");
      }
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
    .catch(err => console.error(err));
}

/* ========= VEG MENU MANAGEMENT ========= */
function loadVegMenu() {
  const content = document.getElementById("content");

  content.innerHTML = "<h2>Loading Veg Menu...</h2>";

  fetch(`${API_BASE}/api/food?type=veg`, {
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
    <input id="vegImage" type="file" accept="image/*">
    <button onclick="addVeg()">Save</button>
    <button onclick="loadVegMenu()">Cancel</button>
  `;
}

function addVeg() {
  const formData = new FormData();

  formData.append("name", document.getElementById("vegName").value);
  formData.append("price", document.getElementById("vegPrice").value);
  formData.append("item_type", "veg");

  const imageFile = document.getElementById("vegImage").files[0];

  if (!imageFile) {
    alert("Please select an image");
    return;
  }


  if (imageFile.size > 5 * 1024 * 1024) {
    alert("Image must be under 5MB");
    return;
  }

  formData.append("image", imageFile);

  fetch(`${API_BASE}/api/food/add`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      alert(data.error || "Failed to add item");
      return;
    }

    alert("Item added successfully!");
    loadVegMenu();
  })
  .catch(err => {
    console.log("Veg add error:", err);
    alert("Server error");
  });
}

/* ========= DELETE VEG ========= */
function deleteVeg(id) {
  if (!confirm("Delete this item?")) return;

  fetch(`${API_BASE}/api/food/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
    .then(res => res.json())
.then(data => {
  if (!data.success) throw new Error("Delete failed");
  alert("Item deleted");
  loadVegMenu(); // or loadNonVegMenu
})
    .catch(() => alert("Failed to delete veg item"));
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

  fetch(`${API_BASE}/api/food?type=nonveg`, {
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
    <input id="nonvegImage" type="file" accept="image/*">

    <button onclick="addNonVeg()">Save</button>
    <button onclick="loadNonVegMenu()">Cancel</button>
  `;
}

function addNonVeg() {
  const formData = new FormData();

  formData.append("name", document.getElementById("nonvegName").value);
  formData.append("price", document.getElementById("nonvegPrice").value);
  formData.append("item_type", "nonveg");

  const imageFile = document.getElementById("nonvegImage").files[0];

  if (!imageFile) {
    alert("Please select an image");
    return;
  }

  if (imageFile.size > 5 * 1024 * 1024) {
    alert("Image must be under 5MB");
    return;
  }

  formData.append("image", imageFile);

  fetch(`${API_BASE}/api/food/add`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      alert(data.error || "Failed to add item");
      return;
    }

    alert("Item added successfully!");
    loadNonVegMenu();
  })
  .catch(err => {
    console.log("NonVeg add error:", err);
    alert("Server error");
  });
}


/* ========= DELETE NON-VEG ========= */
function deleteNonVeg(id) {
  if (!confirm("Delete this item?")) return;

  fetch(`${API_BASE}/api/food/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
    .then(res => res.json())
.then(data => {
  if (!data.success) throw new Error("Delete failed");
  alert("Item deleted");
  loadNonVegMenu();
})
    .catch(() => alert("Failed to delete veg item"));
}

function loadTiffinBookings() {
  const content = document.getElementById("content");
  content.innerHTML = "<h2>Loading Tiffin Bookings...</h2>";

  fetch(`${API_BASE}/api/admin/tiffin-bookings`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => res.json())
  .then(async bookings => {

    let html = `
      <h2>Tiffin Subscriptions</h2>
      <table>
        <tr>
          <th>Name</th>
          <th>Father</th>
          <th>Profession</th>
          <th>Email</th>
          <th>Phone</th>
          <th>City</th>
          <th>State</th>
          <th>Address</th>
          <th>Start Date</th>
          <th>Plan</th>
          <th>Status</th>
          <th>Payment</th>
          <th>Action</th>
        </tr>
    `;

    for (const b of bookings) {

      html += `
        <tr>
          <td>${b.userName || ""}</td>
          <td>${b.fatherName || ""}</td>
          <td>${b.profession || ""}</td>
          <td>${b.email || ""}</td>
          <td>${b.phone || ""}</td>
          <td>${b.city || ""}</td>
          <td>${b.state || ""}</td>
          <td>${b.address || ""}</td>
          <td>${b.startDate ? new Date(b.startDate).toLocaleDateString() : ""}</td>
          <td>${b.planName}</td>
          <td>${b.status}</td>
          <td>${b.paymentStatus}</td>
   <td>
  ${
    b.status === "pending"
      ? `<button onclick="activateTiffin('${b._id}')">Activate</button>`
      : `<span style="color:#146400;font-weight:bold">Active</span>`
  }
  <br/>

  <button style="background:red;color:white;margin-top:5px"
    onclick="deleteTiffinBooking('${b._id}')">
    Delete
  </button>

  <br/>

  <button onclick="toggleMenu('${b._id}')" 
          style="background:#10332F;color:white;margin-top:5px">
    See Menu
  </button>
</td>
        </tr>
      `;


try {

  const menuRes = await fetch(`${API_BASE}/api/tiffin-menus/${b._id}`);

  if (!menuRes.ok) {
    html += `
      <tr class="menuRow-${b._id}" style="display:none;">
        <td colspan="13" style="color:red;">
          User has not created menu yet
        </td>
      </tr>
    `;
  } else {

    const menu = await menuRes.json();

    if (menu && menu.days) {

      menu.days.forEach(d => {
        html += `
        <tr class="menuRow-${b._id}" style="display:none;">
          <td colspan="13">
            <b>Day ${d.dayNumber}</b><br>
            Breakfast: ${d.breakfast.items.join(", ")} (${d.breakfast.time})<br>
            Lunch: ${d.lunch.items.join(", ")} (${d.lunch.time})<br>
            Dinner: ${d.dinner.items.join(", ")} (${d.dinner.time})
          </td>
        </tr>
        `;
      });

    }

  }

} catch (err) {
  console.log("Menu fetch error", err);
}
    }

    html += "</table>";
    content.innerHTML = html;

  })
  .catch(() => {
    content.innerHTML = "<p>Failed to load bookings</p>";
  });
}
function toggleMenu(bookingId) {

  const rows = document.querySelectorAll(`.menuRow-${bookingId}`);

  rows.forEach(row => {

    if (row.style.display === "none") {
      row.style.display = "table-row";
    } else {
      row.style.display = "none";
    }
   
  });
   {
console.log("Toggled menu row", row);
    }
}


function deleteTiffinBooking(id) {
  if (!confirm("Delete this booking?")) return;

  fetch(`${API_BASE}/api/admin/tiffin-bookings/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => res.json())
  .then(() => {
    alert("Booking Deleted");
    loadTiffinBookings();
  })
  .catch(() => alert("Delete failed"));
}


function activateTiffin(id) {
  if (!confirm("Activate this tiffin subscription?")) return;

  fetch(`${API_BASE}/api/admin/tiffin-bookings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({
      status: "active",
      paymentStatus: "paid",
      startDate: new Date()   
    })
  })
  .then(() => {
    alert("Tiffin Activated");
    loadTiffinBookings();
  });
}


function loadTiffins() {
  const content = document.getElementById("content");
  content.innerHTML = "<h2>Loading Tiffin Plans...</h2>";

  fetch(`${API_BASE}/api/admin/tiffins`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
    .then(res => res.json())
    .then(plans => {
      let html = `
        <h2>Tiffin Plans</h2>
        <button onclick="showAddTiffinForm()">+ Add Tiffin Plan</button>

        <table>
          <tr>
            <th>Plan</th>
            <th>Type</th>
            <th>Price</th>
            <th>Meals</th>
            <th>Active</th>
            <th>Action</th>
          </tr>
      `;

      plans.forEach(p => {
        html += `
          <tr>
            <td>${p.planName}</td>
            <td>${p.type}</td>
            <td>₹${p.price}</td>
            <td>${p.mealTime ? p.mealTime.join(", ") : ""}</td>
            <td>${p.active ? "Yes" : "No"}</td>
            <td>
              <button onclick="deleteTiffin('${p._id}')">Delete</button>
            </td>
          </tr>
        `;
      });

      html += "</table>";
      content.innerHTML = html;
    });
}

function deleteTiffin(id) {
  if (!confirm("Delete this tiffin plan?")) return;

  fetch(`${API_BASE}/api/admin/tiffins/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => res.json())
  .then(() => {
    alert("Plan Deleted");
    loadTiffins(); 
  })
  .catch(() => alert("Delete failed"));
}

function showAddTiffinForm() {
  document.getElementById("content").innerHTML = `
    <h2>Add Tiffin Plan</h2>

    <input id="planName" placeholder="Plan Name">

    <select id="type">
      <option value="veg">Veg</option>
      <option value="nonveg">Non-Veg</option>
    </select>

    <div>
      <label><input type="checkbox" name="mealTime" value="breakfast"> Breakfast</label>
      <label><input type="checkbox" name="mealTime" value="lunch"> Lunch</label>
      <label><input type="checkbox" name="mealTime" value="dinner"> Dinner</label>
    </div>

    <textarea id="description" placeholder="Plan Description"></textarea>

    <input id="price" type="number" placeholder="Monthly Price">

    <button onclick="addTiffin()">Save</button>
    <button onclick="loadTiffins()">Cancel</button>
  `;
}

function addTiffin() {
  const mealTime = Array.from(
    document.querySelectorAll("input[name='mealTime']:checked")
  ).map(el => el.value);

  fetch(`${API_BASE}/api/admin/tiffins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({
      planName: document.getElementById("planName").value,
      type: document.getElementById("type").value,
      mealTime: mealTime,
      description: document.getElementById("description").value,
      price: document.getElementById("price").value,
      active: true
    })
  })
  .then(res => res.json())
  .then(data => {
    if (!data || data.message) {
      alert("Failed to add tiffin");
      return;
    }

    alert("Tiffin Added Successfully");
    loadTiffins();   
  })
  .catch(err => {
    console.error(err);
    alert("Server error");
  });
}


function loadDefaultMenu() {

  const content = document.getElementById("content");

  content.innerHTML = `
    <h2>Set Weekly Tiffin Menu</h2>
    <div id="adminMenuContainer"></div>
    <button class="setMenuBtn" onclick="saveDefaultMenu()">Set Tiffin Menu</button>
  `;

  const container = document.getElementById("adminMenuContainer");

  for (let day = 1; day <= 7; day++) {

    container.innerHTML += `
      <div class="admin-day-card">
        <div class="admin-day-header" onclick="toggleAdminDay(${day})">
          Day ${day}
        </div>

        <div class="admin-day-body" id="adminDay${day}" style="display:none;">

          ${createMealFields("breakfast", day)}
          ${createMealFields("lunch", day)}
          ${createMealFields("dinner", day)}

        </div>
      </div>
    `;
  }

  loadExistingDefaultMenu();
}

function createMealFields(meal, day) {

  return `
    <h4>${meal.toUpperCase()}</h4>
    <input type="text" id="${meal}Items${day}" 
      placeholder="Items (comma separated like 1,2,3,4)">
    <input type="text" id="${meal}Time${day}" 
      placeholder="Timing (7:00AM-7:30AM)">
  `;
}


function toggleAdminDay(day) {

  for (let i = 1; i <= 7; i++) {
    const el = document.getElementById(`adminDay${i}`);
    if (el) el.style.display = "none";
  }

  document.getElementById(`adminDay${day}`).style.display = "block";
}


function saveDefaultMenu() {

  const days = [];

  for (let day = 1; day <= 7; day++) {

    days.push({
      dayNumber: day,
      breakfast: {
        items: document.getElementById(`breakfastItems${day}`).value.split(","),
        time: document.getElementById(`breakfastTime${day}`).value
      },
      lunch: {
        items: document.getElementById(`lunchItems${day}`).value.split(","),
        time: document.getElementById(`lunchTime${day}`).value
      },
      dinner: {
        items: document.getElementById(`dinnerItems${day}`).value.split(","),
        time: document.getElementById(`dinnerTime${day}`).value
      }
    });
  }

  fetch(`${API_BASE}/api/default-menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({ days })
  })
  .then(() => alert("Default Tiffin Menu Saved Successfully"));
}


function loadExistingDefaultMenu() {

  fetch(`${API_BASE}/api/admin/default-menu`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  })
  .then(res => res.json())
  .then(menu => {

    if (!menu) return;

    menu.days.forEach(d => {

      document.getElementById(`breakfastItems${d.dayNumber}`).value =
        d.breakfast.items.join(",");

      document.getElementById(`breakfastTime${d.dayNumber}`).value =
        d.breakfast.time;

      document.getElementById(`lunchItems${d.dayNumber}`).value =
        d.lunch.items.join(",");

      document.getElementById(`lunchTime${d.dayNumber}`).value =
        d.lunch.time;

      document.getElementById(`dinnerItems${d.dayNumber}`).value =
        d.dinner.items.join(",");

      document.getElementById(`dinnerTime${d.dayNumber}`).value =
        d.dinner.time;
    });
  });
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
      if (res.status === 401) {
        logoutAdmin();
        throw new Error("Unauthorized");
      }
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
    .catch(err => {
      console.error(err);
      content.innerHTML = "<p>Failed to load users. Try again.</p>";
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
      if (res.status === 401) {
        logoutAdmin();
        throw new Error("Unauthorized");
      }
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
              <td>${order.userId?.name || "Guest"}</td>
              <td>₹${order.totalPrice}</td>
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
    .catch(err => {
      console.error("Orders error:", err);
      content.innerHTML = "<p>Failed to load orders. Try again.</p>";
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
    .then(res => {
      if (res.status === 401) {
        logoutAdmin();
        throw new Error("Unauthorized");
      }
      return res.json();
    })
    .then(() => loadOrders())
    .catch(err => console.error(err));
}


function fetchAuth(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    }
  });
}
