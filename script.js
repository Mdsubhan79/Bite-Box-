const BASE_URL = 'https://bbbackend-bng2.onrender.com';

/* ---------------- CART ---------------- */
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
  const count = cart.reduce((t, i) => t + i.quantity, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

function addToCart(item) {
  const found = cart.find(i => i._id === item._id);
  if (found) {
    found.quantity++;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert("Added to cart");
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

/* ---------------- UI ---------------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])
  );
}

function createFoodCard(item) {
  const img = item.image
    ? `${BASE_URL}${item.image}`
    : 'images/default-food.jpg';

  return `
    <div class="food-card">
      <img src="${escapeHtml(img)}" class="food-img">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description || '')}</p>
      <p class="price">₹${item.price}</p>
      <button class="order-btn" data-id="${item._id}">Add to Cart</button>
    </div>
  `;
}


function renderFood(containerId, items) {
  const box = document.getElementById(containerId);
  if (!box) return;

  if (!items.length) {
    box.innerHTML = "<p>No items available</p>";
    return;
  }

  box.innerHTML = items.map(createFoodCard).join('');

  box.querySelectorAll('.add-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const item = items.find(i => i._id === id);
      if (item) addToCart(item);
    };
  });
}

/* ---------------- LOAD FOOD ---------------- */
async function loadFood() {
  const all = await fetchAllFood();

  // VEG PAGE
  renderFood(
    'vegFoodItems',
    all.filter(i => i.item_type === 'veg')
  );

  // NON-VEG PAGE
  renderFood(
    'nonVegFoodItems',
    all.filter(i => i.item_type === 'nonveg')
  );
}

/* ---------------- DELETE FOOD (ADMIN USE) ---------------- */
async function deleteFood(id) {
  if (!confirm('Delete this item?')) return;

  await fetch(`${BASE_URL}/api/food/${id}`, {
    method: 'DELETE'
  });

  loadFood();
}

window.deleteFood = deleteFood;

/* ---------------- INIT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  loadFood();
});
