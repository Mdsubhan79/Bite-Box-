// Admin Authentication
const adminEmail = "md.sammlk00@gmail.com";
const user = JSON.parse(localStorage.getItem("biteboxUser"));
const isAdmin = localStorage.getItem("biteboxAdmin") === "true";

if (!user || !isAdmin) {
    alert("You are not authorized!");
    window.location.href = "login.html";
}

// Sidebar Navigation
function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");
}

// Logout
function logout() {
    localStorage.removeItem("biteboxUser");
    localStorage.removeItem("biteboxToken");
    localStorage.removeItem("biteboxAdmin");
    window.location.href = "login.html";
}

// Dummy Data
let users = [
    {name:"John Doe", email:"john@example.com", blocked:false},
    {name:"Jane Smith", email:"jane@example.com", blocked:false},
];

let foods = [
    {name:"Pizza", category:"Non-Veg", price:200},
    {name:"Burger", category:"Veg", price:120},
];

let bookings = [
    {user:"John Doe", plan:"Standard", status:"Pending"},
    {user:"Jane Smith", plan:"Premium", status:"Approved"},
];

let orders = [
    {id:"ORD001", user:"John Doe", items:"Pizza x1", status:"Pending"},
    {id:"ORD002", user:"Jane Smith", items:"Burger x2", status:"Preparing"},
];

let notifications = [];

// Dashboard Stats
function updateDashboard() {
    document.getElementById("totalUsers").textContent = users.length;
    document.getElementById("totalFood").textContent = foods.length;
    document.getElementById("totalBookings").textContent = bookings.length;
    document.getElementById("totalOrders").textContent = orders.length;
    document.getElementById("todayOrders").textContent = orders.length;
    document.getElementById("liveUsers").textContent = users.filter(u=>!u.blocked).length;
}

// Users Table
function renderUsers() {
    const tbody = document.getElementById("usersTable").querySelector("tbody");
    tbody.innerHTML = "";
    users.forEach((u,i)=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.blocked?"Blocked":"Active"}</td>
        <td>
            <button onclick="toggleBlock(${i})">${u.blocked?"Unblock":"Block"}</button>
            <button onclick="deleteUser(${i})">Delete</button>
        </td>`;
        tbody.appendChild(tr);
    });
}

function toggleBlock(index) {
    users[index].blocked = !users[index].blocked;
    renderUsers();
    updateDashboard();
}

function deleteUser(index) {
    users.splice(index,1);
    renderUsers();
    updateDashboard();
}

// Food Table
function renderFood() {
    const tbody = document.getElementById("foodTable").querySelector("tbody");
    tbody.innerHTML = "";
    foods.forEach((f,i)=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${f.name}</td>
        <td>${f.category}</td>
        <td>${f.price}</td>
        <td>
            <button onclick="editFood(${i})">Edit</button>
            <button onclick="deleteFood(${i})">Delete</button>
        </td>`;
        tbody.appendChild(tr);
    });
}

// Food Modal
let editingFoodIndex = null;
const modal = document.getElementById("foodModal");
function openFoodModal() {
    editingFoodIndex = null;
    document.getElementById("foodModalTitle").textContent = "Add Food";
    document.getElementById("foodName").value = "";
    document.getElementById("foodCategory").value = "";
    document.getElementById("foodPrice").value = "";
    modal.style.display = "flex";
}
function closeFoodModal() { modal.style.display="none"; }
function saveFood() {
    const name = document.getElementById("foodName").value.trim();
    const category = document.getElementById("foodCategory").value.trim();
    const price = parseFloat(document.getElementById("foodPrice").value);
    if(!name||!category||!price) { alert("Please fill all fields"); return; }

    if(editingFoodIndex!==null) foods[editingFoodIndex] = {name, category, price};
    else foods.push({name, category, price});

    renderFood();
    updateDashboard();
    closeFoodModal();
}
function editFood(index) {
    editingFoodIndex = index;
    document.getElementById("foodModalTitle").textContent = "Edit Food";
    document.getElementById("foodName").value = foods[index].name;
    document.getElementById("foodCategory").value = foods[index].category;
    document.getElementById("foodPrice").value = foods[index].price;
    modal.style.display = "flex";
}
function deleteFood(index) { foods.splice(index,1); renderFood(); updateDashboard(); }

// Bookings Table
function renderBookings() {
    const tbody = document.getElementById("bookingTable").querySelector("tbody");
    tbody.innerHTML = "";
    bookings.forEach((b,i)=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${b.user}</td><td>${b.plan}</td><td>${b.status}</td>
        <td>
        <button onclick="updateBooking(${i},'Approved')">Approve</button>
        <button onclick="updateBooking(${i},'Rejected')">Reject</button>
        </td>`;
        tbody.appendChild(tr);
    });
}
function updateBooking(index,status) {
    bookings[index].status = status;
    renderBookings();
}

// Orders Table
function renderOrders() {
    const tbody = document.getElementById("ordersTable").querySelector("tbody");
    tbody.innerHTML = "";
    orders.forEach((o,i)=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${o.id}</td><td>${o.user}</td><td>${o.items}</td><td>${o.status}</td>
        <td>
        <button onclick="updateOrder(${i})">Next Status</button>
        </td>`;
        tbody.appendChild(tr);
    });
}
function updateOrder(index){
    const status = orders[index].status;
    if(status==="Pending") orders[index].status="Preparing";
    else if(status==="Preparing") orders[index].status="Delivered";
    renderOrders();
}

// Notifications
function sendNotification() {
    const msg = document.getElementById("notificationMessage").value.trim();
    if(!msg) return alert("Enter message");
    notifications.push(msg);
    document.getElementById("sentNotifications").innerHTML = notifications.map(n=>`<li>${n}</li>`).join("");
    document.getElementById("notificationMessage").value="";
}

// Initial render
updateDashboard();
renderUsers();
renderFood();
renderBookings();
renderOrders();
