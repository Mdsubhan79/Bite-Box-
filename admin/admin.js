
const API_BASE = "https://bbbackend-bng2.onrender.com";
const token = localStorage.getItem("adminToken");

if (!token || token === "undefined") {
  window.location.href = "login.html";
}

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

function makeTableMobileResponsive(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const headers = [];
  const headerCells = table.querySelectorAll('thead th');
  
  headerCells.forEach(header => {
    headers.push(header.textContent.trim());
  });
  
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    cells.forEach((cell, index) => {
      if (headers[index]) {
        cell.setAttribute('data-label', headers[index]);
      }
    });
  });
}
/* ========= DASHBOARD */

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
  loadVegMenu(); 
})
    .catch(() => alert("Failed to delete veg item"));
}

/* ========= LOGOUT ========= */
function logoutAdmin() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

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



let adminWS = null;

// Initialize WebSocket
function initializeAdminWebSocket() {
    const wsUrl = 'wss://bbbackend-bng2.onrender.com';
    adminWS = new WebSocket(wsUrl);
    
    adminWS.onopen = () => {
        console.log('✅ Admin WebSocket connected');
    };
    
    adminWS.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'NEW_ORDER') {
            showAdminNotification('New order received!');
            if (document.getElementById('ordersList')) {
                loadOrders();
            }
        } else if (data.type === 'ORDER_UPDATED') {
            console.log('Order updated:', data.order);
        }
    };

    adminWS.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    adminWS.onclose = () => {
        console.log('WebSocket closed, reconnecting in 5 seconds...');
        setTimeout(() => {
            initializeAdminWebSocket();
        }, 5000);
    };
}


initializeAdminWebSocket();

function broadcastOrderDeletion(orderId, reason) {
    if (adminWS && adminWS.readyState === WebSocket.OPEN) {
        try {
            adminWS.send(JSON.stringify({
                type: 'ORDER_DELETED',
                orderId: orderId,
                reason: reason
            }));
            return true;
        } catch (e) {
            console.error('WebSocket send error:', e);
        }
    }
    return false;
}


// Show admin notification
function showAdminNotification(message) {
    if (Notification.permission === 'granted') {
        new Notification('Brio Bite Admin', { 
            body: message,
            icon: 'briobite.png'
        });
    }
}
/* ========= ORDERS MANAGEMENT  ========= */


function loadOrders() {
    const content = document.getElementById("content");
    

    content.innerHTML = `
        <div style="text-align: center; padding: 50px;">
            <h2><i class="fas fa-spinner fa-spin"></i> Loading Orders...</h2>
        </div>
    `;

  
    fetch(`${API_BASE}/api/admin/orders`, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("adminToken")
        }
    })
    .then(res => {
        if (res.status === 401) {
            logoutAdmin();
            throw new Error("Unauthorized");
        }
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        console.log("Orders received:", data);
        displayOrders(data.orders || [], data.stats || {});
    })
    .catch(err => {
        console.error("Error loading orders:", err);
        content.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2 style="color: #dc3545;">Error Loading Orders</h2>
                <p>${err.message}</p>
                <button onclick="loadOrders()" style="padding: 10px 20px; margin-top: 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    });
}


function displayOrders(orders, stats) {
    const content = document.getElementById("content");
    
    if (!orders || orders.length === 0) {
        content.innerHTML = `
            <h2>Orders Management</h2>
            
            <!-- Stats Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4>Total Orders</h4>
                    <p style="font-size: 32px; font-weight: bold;">${stats.totalOrders || 0}</p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4>Today's Orders</h4>
                    <p style="font-size: 32px; font-weight: bold;">${stats.todayOrders || 0}</p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4>Delivered (10 days)</h4>
                    <p style="font-size: 32px; font-weight: bold;">${stats.deliveredLast10Days || 0}</p>
                </div>
            </div>
            
            <p style="text-align: center; padding: 50px; color: #666;">No orders found</p>
            <button onclick="loadOrders()" style="display: block; margin: 0 auto; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Refresh
            </button>
        `;
        return;
    }
    
 
    let html = `
        <h2>Orders Management</h2>
        
        <!-- Stats Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                <h4>Total Orders</h4>
                <p style="font-size: 32px; font-weight: bold;">${stats.totalOrders || orders.length}</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                <h4>Today's Orders</h4>
                <p style="font-size: 32px; font-weight: bold;">${stats.todayOrders || orders.filter(o => new Date(o.orderTime).toDateString() === new Date().toDateString()).length}</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                <h4>Pending</h4>
                <p style="font-size: 32px; font-weight: bold; color: #ffc107;">${orders.filter(o => o.orderStatus === 'pending').length}</p>
            </div>
        </div>
        
        <!-- Refresh Button -->
        <div style="margin-bottom: 20px;">
            <button onclick="loadOrders()" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-sync-alt"></i> Refresh Orders
            </button>
        </div>
        
        <!-- Orders Table -->
        <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <thead>
                <tr style="background: #343a40; color: white;">
                    <th style="padding: 12px;">Order ID</th>
                    <th style="padding: 12px;">Customer</th>
                    <th style="padding: 12px;">Phone</th>
                    <th style="padding: 12px;">Items</th>
                    <th style="padding: 12px;">Total</th>
                    <th style="padding: 12px;">Status</th>
                    <th style="padding: 12px;">Payment</th>
                    <th style="padding: 12px;">Order Time</th>
                    <th style="padding: 12px;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    orders.forEach(order => {
        const itemsCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        const statusColor = getStatusColor(order.orderStatus);
        
        html += `
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px;">#${order._id.slice(-6)}</td>
                <td style="padding: 12px;">${order.customerDetails?.name || 'N/A'}</td>
                <td style="padding: 12px;">${order.customerDetails?.phone || 'N/A'}</td>
                <td style="padding: 12px;">${itemsCount} items</td>
                <td style="padding: 12px;">₹${order.totalAmount || 0}</td>
                <td style="padding: 12px;">
                    <select onchange="updateOrderStatus('${order._id}', this.value)" 
                            style="padding: 5px; border-radius: 3px; border: 1px solid #ddd;">
                        <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.orderStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="preparing" ${order.orderStatus === 'preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="out-for-delivery" ${order.orderStatus === 'out-for-delivery' ? 'selected' : ''}>Out for Delivery</option>
                        <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td style="padding: 12px;">
                    <span style="padding: 3px 8px; border-radius: 3px; background: ${order.paymentStatus === 'paid' ? '#28a745' : '#ffc107'}; color: white;">
                        ${order.paymentStatus || 'pending'}
                    </span>
                </td>
                <td style="padding: 12px;">${new Date(order.orderTime || order.createdAt).toLocaleString()}</td>
                <td style="padding: 12px;">
                    <button onclick="viewOrderDetails('${order._id}')" style="padding: 5px 10px; background: #17a2b8; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">
                        View
                    </button>
                    <button onclick="deleteOrder('${order._id}')" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        </div>
    `;
    
    content.innerHTML = html;
}


function getStatusColor(status) {
    const colors = {
        'pending': '#ffc107',
        'confirmed': '#17a2b8',
        'preparing': '#fd7e14',
        'out-for-delivery': '#007bff',
        'delivered': '#28a745',
        'cancelled': '#dc3545'
    };
    return colors[status] || '#6c757d';
}


function updateOrderStatus(orderId, status) {
    if (!confirm(`Change order status to ${status}?`)) return;
    
 
    let adminNotes = '';
    if (status === 'cancelled') {
        adminNotes = prompt("Enter reason for cancellation (will be shown to customer):", "Order cancelled by restaurant");
        if (adminNotes === null) return
    }
    
    fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("adminToken")
        },
        body: JSON.stringify({ 
            status: status,
            adminNotes: adminNotes
        })
    })
    .then(res => {
        if (res.status === 401) {
            logoutAdmin();
            throw new Error("Unauthorized");
        }
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        alert(`✅ Order status updated to ${status}!`);
        
       
        if (adminWS && adminWS.readyState === WebSocket.OPEN) {
            if (status === 'delivered') {
                adminWS.send(JSON.stringify({
                    type: 'ORDER_DELIVERED',
                    order: data
                }));
            } else if (status === 'cancelled') {
                adminWS.send(JSON.stringify({
                    type: 'ORDER_CANCELLED',
                    order: data
                }));
            } else {
                adminWS.send(JSON.stringify({
                    type: 'ORDER_UPDATED',
                    order: data
                }));
            }
            console.log(`Broadcast sent: ${status}`);
        } else {
            console.log('WebSocket not available');
           
            initializeAdminWebSocket();
        }
        
        loadOrders(); 
    })
    .catch(err => {
        console.error("Error updating order:", err);
        alert("❌ Failed to update order status: " + err.message);
    });
}


function viewOrderDetails(orderId) { 
    alert(`Viewing order #${orderId} - Full details feature coming soon!`);
}


function deleteOrder(orderId) {
    if (!confirm("⚠️ Are you sure you want to permanently delete this order?")) return;
    
    const reason = prompt("Enter reason for deletion (optional):", "Order cancelled by admin");
    
    
    const deleteBtn = event?.target;
    const originalText = deleteBtn?.innerHTML;
    if (deleteBtn) {
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        deleteBtn.disabled = true;
    }
    
    
    fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("adminToken")
        }
    })
    .then(async res => {
        if (res.status === 401) {
            logoutAdmin();
            throw new Error("Unauthorized");
        }
        
       
        if (res.status === 404 || res.status === 405) {
            console.log("DELETE not supported, trying PUT with action=delete");
            return fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("adminToken")
                },
                body: JSON.stringify({ 
                    action: 'delete',
                    adminNotes: reason,
                    status: 'cancelled'
                })
            });
        }
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP error! status: ${res.status}`);
        }
        return res;
    })
    .then(res => res.json())
    .then(data => {
        alert("✅ Order deleted/cancelled successfully!");
        
        
        try {
           
            if (adminWS && adminWS.readyState === WebSocket.OPEN) {
                adminWS.send(JSON.stringify({
                    type: 'ORDER_DELETED',
                    orderId: orderId,
                    reason: reason || 'Order cancelled by admin'
                }));
                console.log("Broadcast sent via WebSocket");
            } else {
                console.log("WebSocket not available, skipping broadcast");
              
                if (!adminWS || adminWS.readyState !== WebSocket.OPEN) {
                    initializeAdminWebSocket();
                }
            }
        } catch (e) {
            console.log('Broadcast error (non-critical):', e);
          
        }
        
        loadOrders(); 
    })
    .catch(err => {
        console.error("Error deleting order:", err);
        alert("❌ Failed to delete order: " + err.message);
        
        if (deleteBtn) {
            deleteBtn.innerHTML = originalText;
            deleteBtn.disabled = false;
        }
    });
}


//functions global
window.loadOrders = loadOrders;
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.updateOrderStatusSimple = updateOrderStatusSimple;
window.updateDeliveryTime = updateDeliveryTime;
window.deleteOrder = deleteOrder;
window.addAdminNotes = addAdminNotes;
window.loadPage = loadPage;
window.logoutAdmin = logoutAdmin;
window.showAddVegForm = showAddVegForm;
window.addVeg = addVeg;
window.deleteVeg = deleteVeg;
window.showAddNonVegForm = showAddNonVegForm;
window.addNonVeg = addNonVeg;
window.deleteNonVeg = deleteNonVeg;
window.activateTiffin = activateTiffin;
window.deleteTiffinBooking = deleteTiffinBooking;
window.toggleMenu = toggleMenu;
window.deleteTiffin = deleteTiffin;
window.showAddTiffinForm = showAddTiffinForm;
window.addTiffin = addTiffin;
window.toggleAdminDay = toggleAdminDay;
window.saveDefaultMenu = saveDefaultMenu;