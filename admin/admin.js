
const API_BASE = "https://bbbackend-bng2.onrender.com";
function formatDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}
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

    case "orders":
       loadOrders();
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

    
    case "catering":
        loadCateringServices();
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

/* ========= CATERING SERVICES ========= */

// Add this function to your admin.js file, replacing the existing catering functions

function loadCateringServices() {
    const contentBody = document.getElementById("content");
    if (!contentBody) return;
    
    contentBody.innerHTML = `
        <div class="catering-admin-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin:0;">🍽️ Catering Services Management</h2>
            <button onclick="showAddCateringForm()" style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                + Add New Service
            </button>
        </div>
        <div id="cateringServicesList" style="display: grid; gap: 20px;">
            <div style="text-align: center; padding: 40px;">Loading catering services...</div>
        </div>
    `;

    fetch(`${API_BASE}/api/catering/services`, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log("Catering services data:", data);
        
        let services = [];
        if (data.services && Array.isArray(data.services)) {
            services = data.services;
        } else if (data.success && data.services) {
            services = data.services;
        } else if (Array.isArray(data)) {
            services = data;
        }
        
        let html = "";
        
        if (services.length === 0) {
            html = `<div style="text-align: center; padding: 60px; background: #f8f9fa; border-radius: 16px;">
                        <i class="fas fa-concierge-bell" style="font-size: 48px; color: #ccc;"></i>
                        <h3>No Catering Services Found</h3>
                        <p>Click "Add New Service" to create your first catering service.</p>
                    </div>`;
        } else {
            services.forEach(service => {
                html += `
                    <div style="background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <h3 style="margin: 0 0 5px 0; color: #2c3e50;">${escapeHtml(service.title)}</h3>
                                <p style="margin: 0 0 5px 0; color: #7f8c8d;">${escapeHtml(service.tagline || '')}</p>
                                <span style="display: inline-block; background: ${getCategoryColor(service.category)}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                                    ${escapeHtml(service.category)}
                                </span>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">₹${service.price}</div>
                                ${service.unit ? `<small style="color: #666;">per ${service.unit}</small>` : ''}
                            </div>
                        </div>
                        
                        ${service.items && service.items.length ? `
                            <div style="margin-top: 15px;">
                                <strong>Includes:</strong>
                                <ul style="margin: 8px 0 0 20px; color: #555;">
                                    ${service.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${service.sizes && service.sizes.length ? `
                            <div style="margin-top: 15px;">
                                <strong>Tent Sizes:</strong>
                                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;">
                                    ${service.sizes.map(size => `
                                        <span style="background: #f0f0f0; padding: 4px 12px; border-radius: 20px;">${escapeHtml(size.size)} - ₹${size.price}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            <button onclick="editCateringService('${service._id}')" style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="deleteCateringService('${service._id}')" style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        document.getElementById("cateringServicesList").innerHTML = html;
    })
    .catch(err => {
        console.error("Error loading catering services:", err);
        document.getElementById("cateringServicesList").innerHTML = `
            <div style="text-align: center; padding: 40px; color: red;">
                Failed to load catering services. Please check your connection.
                <br><button onclick="loadCateringServices()" style="margin-top: 10px; padding: 8px 16px;">Retry</button>
            </div>
        `;
    });
}

function showAddCateringForm() {
    const contentBody = document.getElementById("content");
    
    contentBody.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto;">
            <h2>Add New Catering Service</h2>
            
            <div style="margin-bottom: 15px;">
                <label>Category *</label>
                <select id="cateringCategory" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                    <option value="serving">Serving Staff</option>
                    <option value="cleaning">Cleaning Staff</option>
                    <option value="cooking">Cooking Staff</option>
                    <option value="tent">Tent & Decoration</option>
                    <option value="package">Full Package</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label>Title *</label>
                <input type="text" id="cateringTitle" placeholder="e.g., Professional Serving Staff" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label>Tagline</label>
                <input type="text" id="cateringTagline" placeholder="Short description" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label>Price *</label>
                <input type="number" id="cateringPrice" placeholder="Price in INR" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
            </div>
            <div id="tentSizesContainer">

    <h3>Tent Sizes</h3>

    <div class="tent-size-box">

        <input
            type="text"
            class="tentSize"
            placeholder="Size Example 40x50"
        >

        <input
            type="number"
            class="tentPrice"
            placeholder="Price"
        >

        <textarea
            class="tentItems"
            placeholder="Items comma separated"
        ></textarea>

    </div>

</div>

<button
type="button"
onclick="addTentSizeField()">

    + Add More Tent Size

</button>
            
            <div style="margin-bottom: 15px;">
                <label>Unit (e.g., staff, item)</label>
                <input type="text" id="cateringUnit" placeholder="staff / item / package" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label>Items Included (comma separated)</label>
                <textarea id="cateringItems" placeholder="e.g., Professional Training, Uniform, Equipment" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;"></textarea>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label>Icon (emoji)</label>
                <input type="text" id="cateringIcon" placeholder="🍽️" value="🍽️" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="addCateringService()" style="background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">Save Service</button>
                <button onclick="loadCateringServices()" style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">Cancel</button>
            </div>
        </div>
    `;
}
function addTentSizeField() {

    const container =
    document.getElementById(
        "tentSizesContainer"
    );

    container.innerHTML += `

    <div class="tent-size-box">

        <input
            type="text"
            class="tentSize"
            placeholder="Size Example 60x70"
        >

        <input
            type="number"
            class="tentPrice"
            placeholder="Price"
        >

        <textarea
            class="tentItems"
            placeholder="Items comma separated"
        ></textarea>

    </div>

    `;

}
function addCateringService() {
    const sizes = [];

document.querySelectorAll(
    ".tent-size-box"
).forEach(box => {

    sizes.push({

        size:
        box.querySelector(".tentSize").value,

        price:
        box.querySelector(".tentPrice").value,

        items:
        box.querySelector(".tentItems")
        .value
        .split(",")
        .map(i => i.trim())

    });

});
    const data = {
        title: document.getElementById("cateringTitle").value,
        tagline: document.getElementById("cateringTagline").value,
        category: document.getElementById("cateringCategory").value,
        price: Number(document.getElementById("cateringPrice").value),
        unit: document.getElementById("cateringUnit").value || "staff",
        items: document.getElementById("cateringItems").value.split(",").map(i => i.trim()).filter(i => i),
        icon: document.getElementById("cateringIcon").value || "🍽️",
        active: true
    };
    
    if (!data.title || !data.price) {
        alert("Please fill in Title and Price");
        return;
    }
    
    fetch(`${API_BASE}/api/catering/admin/add-service`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("adminToken")
        },
        body: JSON.stringify(data)
    })
    .then(async res => {
        const response = await res.json();
        if (!res.ok) throw new Error(response.message || "Failed to add");
        return response;
    })
    .then(() => {
        alert("✅ Catering Service Added Successfully!");
        loadCateringServices();
    })
    .catch(err => {
        console.error(err);
        alert("Error: " + err.message);
    });
}

function deleteCateringService(id) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    fetch(`${API_BASE}/api/catering/admin/delete-service/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("adminToken")
        }
    })
    .then(() => {
        alert("✅ Service Deleted");
        loadCateringServices();
    })
    .catch(err => {
        console.error(err);
        alert("Failed to delete service");
    });
}

function editCateringService(id) {
    // Fetch the service and populate edit form
    fetch(`${API_BASE}/api/catering/services`, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
    })
    .then(res => res.json())
    .then(data => {
        let services = data.services || data;
        const service = services.find(s => s._id === id);
        if (!service) {
            alert("Service not found");
            return;
        }
        
        const contentBody = document.getElementById("content");
        contentBody.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <h2>Edit Catering Service</h2>
                
                <div style="margin-bottom: 15px;">
                    <label>Category</label>
                    <select id="cateringCategory" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        <option value="serving" ${service.category === 'serving' ? 'selected' : ''}>Serving Staff</option>
                        <option value="cleaning" ${service.category === 'cleaning' ? 'selected' : ''}>Cleaning Staff</option>
                        <option value="cooking" ${service.category === 'cooking' ? 'selected' : ''}>Cooking Staff</option>
                        <option value="tent" ${service.category === 'tent' ? 'selected' : ''}>Tent & Decoration</option>
                        <option value="package" ${service.category === 'package' ? 'selected' : ''}>Full Package</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label>Title</label>
                    <input type="text" id="cateringTitle" value="${escapeHtml(service.title)}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label>Tagline</label>
                    <input type="text" id="cateringTagline" value="${escapeHtml(service.tagline || '')}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label>Price</label>
                    <input type="number" id="cateringPrice" value="${service.price}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label>Unit</label>
                    <input type="text" id="cateringUnit" value="${escapeHtml(service.unit || 'staff')}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label>Items (comma separated)</label>
                    <textarea id="cateringItems" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">${service.items ? service.items.join(', ') : ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="updateCateringService('${id}')" style="background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">Update Service</button>
                    <button onclick="loadCateringServices()" style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;
    });
}

function updateCateringService(id) {
    const data = {
        title: document.getElementById("cateringTitle").value,
        tagline: document.getElementById("cateringTagline").value,
        category: document.getElementById("cateringCategory").value,
        price: Number(document.getElementById("cateringPrice").value),
        unit: document.getElementById("cateringUnit").value,
        items:document.getElementById("cateringItems").value.split(",").map(i => i.trim()),sizes: sizes,
        active: true
    };
    
    fetch(`${API_BASE}/api/catering/admin/update-service/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("adminToken")
        },
        body: JSON.stringify(data)
    })
    .then(async res => {
        const response = await res.json();
        if (!res.ok) throw new Error(response.message);
        return response;
    })
    .then(() => {
        alert("✅ Service Updated!");
        loadCateringServices();
    })
    .catch(err => {
        alert("Error: " + err.message);
    });
}

function getCategoryColor(category) {
    const colors = {
        'serving': '#3498db',
        'cleaning': '#2ecc71',
        'cooking': '#e67e22',
        'tent': '#9b59b6',
        'package': '#e74c3c'
    };
    return colors[category] || '#7f8c8d';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

  const baseDate = new Date(b.startDate);
  const currentDate = new Date(baseDate);
  currentDate.setDate(baseDate.getDate() + (d.dayNumber - 1));

 html += `
  <tr class="menuRow-${b._id}" style="display:none;">
    <td colspan="13">

      <b>
        ${formatDate(currentDate)} - Day ${d.dayNumber}
      </b><br>

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
const dateInput = prompt("Enter start date (YYYY-MM-DD):");

fetch(`${API_BASE}/api/admin/tiffin-bookings/${id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("adminToken")
  },
  body: JSON.stringify({
    status: "active",
    paymentStatus: "paid",
    startDate: dateInput
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
        items: document.getElementById(`breakfastItems${day}`).value
          .split(",").map(i => i.trim()).filter(i => i),
        time: document.getElementById(`breakfastTime${day}`).value
      },
      lunch: {
        items: document.getElementById(`lunchItems${day}`).value
          .split(",").map(i => i.trim()).filter(i => i),
        time: document.getElementById(`lunchTime${day}`).value
      },
      dinner: {
        items: document.getElementById(`dinnerItems${day}`).value
          .split(",").map(i => i.trim()).filter(i => i),
        time: document.getElementById(`dinnerTime${day}`).value
      }
    });
  }

  fetch(`${API_BASE}/api/admin/default-menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("adminToken")
    },
    body: JSON.stringify({ days })
  })
  .then(() => {
    alert("✅ Default Tiffin Menu Saved Successfully");

    
    loadExistingDefaultMenu();
  })
  .catch(() => {
    alert("❌ Failed to save menu");
  });
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
            <div class="orders-stats">
                <div class="orders-card">
                    <h4>Total Orders</h4>
                    <p>${stats.totalOrders || 0}</p>
                </div>
                <div class="orders-card">
                    <h4>Pending</h4>
                    <p>0</p>
                </div>
                <div class="orders-card">
                    <h4>Preparing</h4>
                    <p>0</p>
                </div>
                <div class="orders-card">
                    <h4>Out for Delivery</h4>
                    <p>0</p>
                </div>
                <div class="orders-card">
                    <h4>Delivered</h4>
                    <p>0</p>
                </div>
                <div class="orders-card">
                    <h4>Cancelled</h4>
                    <p>0</p>
                </div>
            </div>
            <div class="empty-orders-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>No Orders Found</h3>
                <p>Orders will appear here when customers place them.</p>
                <button class="refresh-orders-btn" onclick="loadOrders()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        `;
        return;
    }
    
    // Calculate stats for all statuses
    const pendingCount = orders.filter(o => o.orderStatus === 'pending').length;
    const confirmedCount = orders.filter(o => o.orderStatus === 'confirmed').length;
    const preparingCount = orders.filter(o => o.orderStatus === 'preparing').length;
    const outForDeliveryCount = orders.filter(o => o.orderStatus === 'out-for-delivery').length;
    const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;
    const cancelledCount = orders.filter(o => o.orderStatus === 'cancelled').length;
    
    let html = `
        <div class="orders-stats">
            <div class="orders-card">
                <h4>Total Orders</h4>
                <p>${stats.totalOrders || orders.length}</p>
            </div>
            <div class="orders-card">
                <h4>Pending</h4>
                <p style="color: #ffc107;">${pendingCount}</p>
            </div>
            <div class="orders-card">
                <h4>Confirmed</h4>
                <p style="color: #17a2b8;">${confirmedCount}</p>
            </div>
            <div class="orders-card">
                <h4>Preparing</h4>
                <p style="color: #fd7e14;">${preparingCount}</p>
            </div>
            <div class="orders-card">
                <h4>Out for Delivery</h4>
                <p style="color: #007bff;">${outForDeliveryCount}</p>
            </div>
            <div class="orders-card">
                <h4>Delivered</h4>
                <p style="color: #28a745;">${deliveredCount}</p>
            </div>
            <div class="orders-card">
                <h4>Cancelled</h4>
                <p style="color: #dc3545;">${cancelledCount}</p>
            </div>
        </div>
        
        <!-- Status Filter Buttons -->
        <div class="status-filters">
            <button class="status-filter-btn active" onclick="filterOrders('all')">All Orders</button>
            <button class="status-filter-btn pending" onclick="filterOrders('pending')">⏳ Pending</button>
            <button class="status-filter-btn confirmed" onclick="filterOrders('confirmed')">✓ Confirmed</button>
            <button class="status-filter-btn preparing" onclick="filterOrders('preparing')">🔪 Preparing</button>
            <button class="status-filter-btn out-for-delivery" onclick="filterOrders('out-for-delivery')">🚚 Out for Delivery</button>
            <button class="status-filter-btn delivered" onclick="filterOrders('delivered')">✅ Delivered</button>
            <button class="status-filter-btn cancelled" onclick="filterOrders('cancelled')">❌ Cancelled</button>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button class="refresh-orders-btn" onclick="loadOrders()">
                <i class="fas fa-sync-alt"></i> Refresh Orders
            </button>
        </div>
        
        <div class="orders-table-container">
        <table class="orders-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Order Time</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
orders
.forEach(order => {
        const itemsCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        
        
        let statusDisplay = '';
        let statusClass = '';
        
        switch(order.orderStatus) {
            case 'pending':
                statusDisplay = '⏳ PENDING';
                statusClass = 'pending';
                break;
            case 'confirmed':
                statusDisplay = '✓ CONFIRMED';
                statusClass = 'confirmed';
                break;
            case 'preparing':
                statusDisplay = '🔪 PREPARING';
                statusClass = 'preparing';
                break;
            case 'out-for-delivery':
                statusDisplay = '🚚 OUT FOR DELIVERY';
                statusClass = 'out-for-delivery';
                break;
            case 'delivered':
                statusDisplay = '✅ DELIVERED';
                statusClass = 'delivered';
                break;
            case 'cancelled':
                statusDisplay = '❌ CANCELLED';
                statusClass = 'cancelled';
                break;
            default:
                statusDisplay = '⏳ PENDING';
                statusClass = 'pending';
        }
        
        html += `
            <tr data-status="${order.orderStatus || 'pending'}">
                <td><span class="order-id">#${order._id.slice(-6)}</span></td>
                <td><strong>${order.customerDetails?.name || 'N/A'}</strong></td>
                <td>${order.customerDetails?.phone || 'N/A'}</td>
                <td><span class="items-count">${itemsCount} items</span></td>
                <td><span class="total-amount">₹${order.totalAmount || 0}</span></td>
                <td>
                    <span class="order-status-badge ${statusClass}">${statusDisplay}</span>
                </td>
                <td>
                    <span class="payment-badge ${order.paymentStatus === 'paid' ? 'payment-paid' : 'payment-pending'}">
                        ${order.paymentStatus || 'pending'}
                    </span>
                </td>
                <td>${new Date(order.orderTime || order.createdAt).toLocaleString()}</td>
                <td>
                    <div class="action-buttons">
                        <select class="order-status-select" onchange="updateOrderStatus('${order._id}', this.value)">
                            <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                            <option value="confirmed" ${order.orderStatus === 'confirmed' ? 'selected' : ''}>✓ Confirmed</option>
                            <option value="preparing" ${order.orderStatus === 'preparing' ? 'selected' : ''}>🔪 Preparing</option>
                            <option value="out-for-delivery" ${order.orderStatus === 'out-for-delivery' ? 'selected' : ''}>🚚 Out for Delivery</option>
                            <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
                            <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                        </select>
                        <button class="orders-btn btn-view" onclick="viewOrderDetails('${order._id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="orders-btn btn-delete" onclick="deleteOrder('${order._id}', this)">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
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
  
makeTableMobileResponsive();
}

function makeTableMobileResponsive() {
    const table = document.querySelector(".orders-table");
    if (!table) return;

   
    const ths = table.querySelectorAll("thead th");
    const headers = Array.from(ths).map(th => th.innerText.trim());

   
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        cells.forEach((td, i) => {
            if (headers[i]) {
                td.setAttribute("data-label", headers[i]);
            }
        });
    });
}

function filterOrders(status) {
   
    document.querySelectorAll('.status-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    

    const rows = document.querySelectorAll('.orders-table tbody tr');
    
    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            if (row.getAttribute('data-status') === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
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

function deleteOrder(orderId, btn) {

    const row = btn?.closest("tr");
    const status = row?.getAttribute("data-status");

    if (status !== "delivered" && status !== "cancelled") {
        alert("❌ You can delete only Delivered or Cancelled orders");
        return;
    }

    if (!confirm("⚠️ Delete this order permanently?")) return;

    const deleteBtn = btn;
    const originalText = deleteBtn.innerHTML;

    deleteBtn.innerHTML = 'Deleting...';
    deleteBtn.disabled = true;

    fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("adminToken")
        },
        body: JSON.stringify({
            action: "delete"   
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("Delete failed");
        return res.json();
    })
    .then(() => {

        alert("✅ Order deleted successfully!");

        if (row) row.remove();

        setTimeout(() => {
            loadOrders();
        }, 500);
    })
    .catch(err => {
        console.error(err);
        alert("❌ Failed to delete order");

        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
    });
}

//functions global
window.loadOrders = loadOrders;
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
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
window.loadCateringServices = loadCateringServices;
window.showAddCateringForm = showAddCateringForm;
window.addCateringService = addCateringService;
window.deleteCateringService = deleteCateringService;