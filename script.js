/* ===== bitebox script.js (upgraded) =====
   - Dynamic load from backend
   - Admin add/edit/delete (prompt-based)
   - Cart preserved
   - Graceful fallback to local menus
-------------------------------------------*/

const BASE_URL = 'https://bbbackend-bng2.onrender.com'; // your backend
let token = localStorage.getItem('biteboxToken') || null;
let isAdmin = localStorage.getItem('biteboxAdmin') === 'true' || (() => {
  const u = JSON.parse(localStorage.getItem('biteboxUser') || '{}');
  return (u.email && u.email.toLowerCase() === 'md.sammlk00@gmail.com');
})();

let cart = JSON.parse(localStorage.getItem('cart')) || [];

/* ---------------- Cart functions (original logic kept) ---------------- */
function addToCart(item) {
  const existingItem = cart.find(cartItem => cartItem.name === item.name);
  const baseImagePath = '';

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...item,
      image: item.image && item.image.startsWith('http') ? item.image : (baseImagePath + (item.image || 'images/default-food.jpg')),
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((total, item) => total + (item.quantity || 0), 0);
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) cartCountElement.textContent = count;
}

/* ---------------- Local fallback menus (kept) ---------------- */
const FALLBACK_VEG = [
  { name: "Paneer Butter Masala", desc: "Rich and creamy curry with paneer cubes.", price: 180, image: "thali5.jpg", category: "veg" },
  { name: "Chole Bhature", desc: "Spicy chickpeas served with fluffy fried bread.", price: 120, image: "thali6.jpg", category: "veg" },
  { name: "Veg Biryani", desc: "Aromatic rice with mixed vegetables and spices.", price: 150, image: "thali1.jpg", category: "veg" },
  { name: "Masala Dosa", desc: "Crispy rice crepe stuffed with spiced potatoes.", price: 90, image: "thali2.jpg", category: "veg" },
  { name: "Aloo Paratha", desc: "Stuffed flatbread served with curd and pickle.", price: 70, image: "thali3.jpg", category: "veg" }
];

const FALLBACK_NONVEG = [
  { name: "Chicken Biryani", desc: "Aromatic rice with tender chicken and spices.", price: 200, image: "thali1.jpg", category: "nonveg" },
  { name: "Butter Chicken", desc: "Creamy tomato-based curry with marinated chicken.", price: 220, image: "thali2.jpg", category: "nonveg" },
  { name: "Egg Curry", desc: "Boiled eggs simmered in spicy gravy.", price: 130, image: "thali3.jpg", category: "nonveg" },
  { name: "Chicken Lollipop", desc: "Crispy fried chicken wings with spicy coating.", price: 160, image: "thali4.jpg", category: "nonveg" },
  { name: "Fish Fry", desc: "Marinated fish fillets fried to golden perfection.", price: 180, image: "thali5.jpg", category: "nonveg" }
];

/* ---------------- Render helpers ---------------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" }[m]));
}

function createFoodCard(item) {
  // item expected shape: { _id?, name, desc, price, image, category }
  const img = item.image ? (item.image.startsWith('http') ? item.image : item.image) : 'images/default-food.jpg';
  const idAttr = item._id ? `data-id="${item._id}"` : '';
  const priceHtml = `<div class="price">₹${escapeHtml(item.price)}</div>`;

  let adminButtons = '';
  if (isAdmin) {
    // edit / delete buttons for admin
    adminButtons = `
      <div style="margin-top:8px;display:flex;gap:8px">
        <button class="order-btn" style="background:#fff;border:1px solid #ccc;color:#10332F" onclick='promptEditFood("${item._id || ''}")'>Edit</button>
        <button class="order-btn" style="background:#ff6b6b;color:#fff" onclick='deleteFood("${item._id || ''}")'>Delete</button>
      </div>
    `;
  }

  // main card html
  const html = `
    <div class="food-card" ${idAttr}>
      <img src="${escapeHtml(img)}" alt="${escapeHtml(item.name)}" class="food-img">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.desc || '')}</p>
      <p class="price">₹${escapeHtml(item.price)}</p>
      <button class="order-btn" onclick='addToCart(${JSON.stringify(item).replace(/'/g,"\\'")})'>Add to Cart</button>
      ${adminButtons}
    </div>
  `;
  return html;
}

function renderFoodList(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach(it => {
    container.insertAdjacentHTML('beforeend', createFoodCard(it));
  });
}

/* ---------------- Backend: fetch all food ---------------- */
async function fetchAllFood() {
  try {
    const res = await fetch(`${BASE_URL}/api/food/all`);
    if (!res.ok) throw new Error('Fetch failed');
    const json = await res.json();
    return json.items || [];
  } catch (e) {
    console.warn('Could not fetch food list from backend, using fallback.', e);
    // fallback -> combine main lists so admin still sees something
    return [...FALLBACK_VEG, ...FALLBACK_NONVEG];
  }
}

/* ---------------- Public loaders used by pages ---------------- */
async function loadVegItems() {
  const all = await fetchAllFood();
  const veg = all.filter(i => (i.category || '').toLowerCase() === 'veg');
  // if none from backend, fallback to local
  const items = veg.length ? veg : FALLBACK_VEG;
  renderFoodList('vegFoodItems', items);
  bindAdminAddUI('veg'); // ensure admin UI present if admin
}

async function loadNonVegItems() {
  const all = await fetchAllFood();
  const nonveg = all.filter(i => (i.category || '').toLowerCase() === 'nonveg' || (i.category || '').toLowerCase() === 'non-veg');
  const items = nonveg.length ? nonveg : FALLBACK_NONVEG;
  renderFoodList('nonVegFoodItems', items);
  bindAdminAddUI('nonveg');
}

/* ---------------- Admin CRUD functions ---------------- */
async function deleteFood(id) {
  if (!id) { alert('Missing item id.'); return; }
  if (!confirm('Delete this food item?')) return;
  if (!token) { alert('Admin not authenticated'); return; }

  try {
    const res = await fetch(`${BASE_URL}/api/food/delete/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      alert('Deleted');
      // reload lists on page
      refreshLists();
    } else {
      const json = await res.json().catch(()=>({message:'Error'}));
      alert(json.message || 'Delete failed');
    }
  } catch (e) {
    console.error(e);
    alert('Server error');
  }
}

window.deleteFood = deleteFood; // expose to inline onclicks

function promptEditFood(id) {
  if (!id) { alert('Missing id'); return; }
  if (!token) { alert('Admin not authenticated'); return; }

  // fetch current item data then prompt
  (async ()=>{
    try {
      // re-fetch all to find item (or call a /food/:id endpoint if you create it)
      const all = await fetchAllFood();
      const item = all.find(x => x._id === id);
      if (!item) { alert('Item not found'); return; }

      const name = prompt('Name', item.name);
      if (name === null) return;
      const desc = prompt('Description', item.description || item.desc || '');
      if (desc === null) return;
      const price = prompt('Price', item.price);
      if (price === null) return;
      const image = prompt('Image URL (absolute) or filename', item.image || '');

      // send update
      const payload = { name, description: desc, price: Number(price), imageUrl: image, category: item.category || 'veg' };
      const res = await fetch(`${BASE_URL}/api/food/edit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Updated');
        refreshLists();
      } else {
        const json = await res.json().catch(()=>({message:'Error updating'}));
        alert(json.message || 'Update failed');
      }
    } catch(e){
      console.error(e);
      alert('Error while editing item');
    }
  })();
}

window.promptEditFood = promptEditFood; // expose to inline onclicks

/* Simple admin add form inserted into page if admin */
function bindAdminAddUI(category) {
  if (!isAdmin) return;
  // Avoid adding duplicate forms
  if (document.getElementById('adminAddFoodForm')) return;

  // Try to append admin form near the menu-section heading
  const menuSection = document.querySelector('.menu-section');
  if (!menuSection) return;
  const formHtml = `
    <div id="adminAddFoodForm" style="margin:12px 0;padding:12px;background:#fff;border-radius:8px;">
      <strong>Admin — Add Food Item</strong>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <input id="adminName" placeholder="Name" style="padding:8px;border-radius:6px;border:1px solid #ddd"/>
        <input id="adminPrice" placeholder="Price" type="number" style="padding:8px;border-radius:6px;border:1px solid #ddd"/>
        <select id="adminCategory"><option value="veg">Veg</option><option value="nonveg">Non-Veg</option></select>
        <input id="adminImage" placeholder="Image URL or filename" style="padding:8px;border-radius:6px;border:1px solid #ddd"/>
        <input id="adminDesc" placeholder="Short description" style="padding:8px;border-radius:6px;border:1px solid #ddd;flex:1;min-width:200px"/>
        <button id="adminAddBtn" style="background:#27ae60;color:#fff;padding:8px 14px;border-radius:6px;border:none;cursor:pointer">Add</button>
      </div>
    </div>
  `;
  menuSection.insertAdjacentHTML('afterbegin', formHtml);

  document.getElementById('adminAddBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    const name = document.getElementById('adminName').value.trim();
    const price = Number(document.getElementById('adminPrice').value || 0);
    const categoryVal = document.getElementById('adminCategory').value;
    const image = document.getElementById('adminImage').value.trim();
    const desc = document.getElementById('adminDesc').value.trim();

    if (!name || !price) { alert('Please provide name and price'); return; }
    if (!token) { alert('Admin not authenticated'); return; }

    const payload = { name, description: desc, price, category: categoryVal, imageUrl: image };
    try {
      const res = await fetch(`${BASE_URL}/api/food/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Added');
        // clear inputs
        document.getElementById('adminName').value = '';
        document.getElementById('adminPrice').value = '';
        document.getElementById('adminImage').value = '';
        document.getElementById('adminDesc').value = '';
        refreshLists();
      } else {
        const json = await res.json().catch(()=>({message:'Error'}));
        alert(json.message || 'Add failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error while adding item');
    }
  });
}

/* Refresh both lists (veg + nonveg) */
function refreshLists(){
  if(document.body.getAttribute('data-page') === 'veg') {
    loadVegItems();
  } else if (document.body.getAttribute('data-page') === 'non-veg') {
    loadNonVegItems();
  } else {
    // if admin area or generic page refresh both containers if present
    const vegEl = document.getElementById('vegFoodItems');
    const nonEl = document.getElementById('nonVegFoodItems');
    if (vegEl) loadVegItems();
    if (nonEl) loadNonVegItems();
  }
}

/* ---------------- Checkout / helper ---------------- */
function checkout() { window.location.href = "cartpage.html"; }

/* ---------------- Init on DOM ready ---------------- */
document.addEventListener("DOMContentLoaded", function () {
  // show cart count
  updateCartCount();

  // load depending on page
  const page = document.body.getAttribute('data-page') || '';
  if (page === 'veg') {
    loadVegItems();
  } else if (page === 'non-veg') {
    // some of your nonveg page used both lists, keep that behavior
    loadNonVegItems();
    loadVegItems();
  } else {
    // general pages may want both lists
    const vegEl = document.getElementById('vegFoodItems');
    if (vegEl) loadVegItems();
    const nonEl = document.getElementById('nonVegFoodItems');
    if (nonEl) loadNonVegItems();
  }

  // small safeguard: if admin but token missing, try to preserve admin view (but actions will prompt)
  if (isAdmin && !token) {
    console.warn('Admin detected but no token found. Admin actions will require login.');
  }

  // expose some useful functions for inline HTML handlers
  window.addToCart = addToCart;
  window.checkout = checkout;
});
