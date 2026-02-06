const BASE_URL = 'https://bbbackend-bng2.onrender.com';

/* ---------------- AUTH ---------------- */
let token = localStorage.getItem('biteboxToken');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function checkAdmin() {
  const user = JSON.parse(localStorage.getItem('biteboxUser') || '{}');
  return (
    localStorage.getItem('biteboxAdmin') === 'true' ||
    (user.email && user.email.toLowerCase() === 'md.sammlk00@gmail.com')
  );
}

/* ---------------- FETCH FOOD ---------------- */
async function fetchAllFood() {
  try {
    const res = await fetch(`${BASE_URL}/api/food`);
    if (!res.ok) throw new Error('Fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Food fetch error:', err);
    return [];
  }
}

/* ---------------- CART ---------------- */
function addToCart(item) {
  const found = cart.find(i => i._id === item._id);
  if (found) found.quantity++;
  else cart.push({ ...item, quantity: 1 });

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((t, i) => t + i.quantity, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

/* ---------------- UI ---------------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])
  );
}

function createFoodCard(item) {
  const isAdmin = checkAdmin();
  const img = item.imageUrl || item.image || 'images/default-food.jpg';

  return `
    <div class="food-card">
      <img src="${escapeHtml(img)}" class="food-img">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description || '')}</p>
      <p class="price">₹${item.price}</p>

      <button class="order-btn add-btn" data-id="${item._id}">
        Add to Cart
      </button>

      ${
        isAdmin
          ? `
        <div class="admin-btns">
          <button onclick="promptEditFood('${item._id}')">Edit</button>
          <button onclick="deleteFood('${item._id}')">Delete</button>
        </div>`
          : ''
      }
    </div>
  `;
}

function renderFood(containerId, items) {
  const box = document.getElementById(containerId);
  if (!box) return;

  box.innerHTML = items.map(createFoodCard).join('');

  box.querySelectorAll('.add-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const item = items.find(i => i._id === id);
      if (item) addToCart(item);
    };
  });
}

/* ---------------- LOAD ---------------- */
async function loadFood() {
  const all = await fetchAllFood();

 renderFood(
  'vegFoodItems',
  all.filter(i => i.item_type === 'veg')
);

renderFood(
  'nonVegFoodItems',
  all.filter(i => i.item_type === 'nonveg')
);


  bindAdminAddUI();
}

/* ---------------- ADMIN CRUD ---------------- */
async function deleteFood(id) {
  if (!confirm('Delete this item?')) return;

  await fetch(`${BASE_URL}/api/food/delete/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });

  loadFood();
}
window.deleteFood = deleteFood;

async function promptEditFood(id) {
  const all = await fetchAllFood();
  const item = all.find(i => i._id === id);
  if (!item) return;

  const name = prompt('Name', item.name);
  const description = prompt('Description', item.description);
  const price = prompt('Price', item.price);
  const imageUrl = prompt('Image URL', item.imageUrl || '');

  if (!name || !price) return alert('Name & price required');

  await fetch(`${BASE_URL}/api/food/edit/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
body: JSON.stringify({
  name,
  description,
  price: Number(price),
  imageUrl,
  item_type: item.item_type
})

  });

  loadFood();
}
window.promptEditFood = promptEditFood;

/* ---------------- ADMIN ADD ---------------- */
function bindAdminAddUI() {
  if (!checkAdmin() || document.getElementById('adminAddFoodForm')) return;

  document.body.insertAdjacentHTML('afterbegin', `
    <div id="adminAddFoodForm">
      <input id="aName" placeholder="Name">
      <input id="aPrice" type="number" placeholder="Price">
      <select id="aCat">
        <option value="veg">Veg</option>
        <option value="nonveg">Non-Veg</option>
      </select>
      <input id="aImg" placeholder="Image URL">
      <input id="aDesc" placeholder="Description">
      <button id="aBtn">Add</button>
    </div>
  `);

  aBtn.onclick = async () => {
    if (!aName.value || !aPrice.value)
      return alert('Name & price required');

    await fetch(`${BASE_URL}/api/food/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
body: JSON.stringify({
  name: aName.value,
  price: Number(aPrice.value),
  item_type: aCat.value,  
  imageUrl: aImg.value,
  description: aDesc.value
})

    });

    loadFood();
  };
}

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  loadFood();
  window.addToCart = addToCart;
});
