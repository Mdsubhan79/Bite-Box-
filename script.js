const BASE_URL = 'https://bbbackend-bng2.onrender.com';

// ========== CART MANAGEMENT ==========

// Get cart from localStorage
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Add item to cart
function addToCart(item) {
    let cart = getCart();
    
    // Check if item already exists
    const existingItem = cart.find(i => i.name === item.name);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            ...item,
            quantity: 1,
            category: item.category || 'veg'
        });
    }
    
    saveCart(cart);
    showNotification('✅ Item added to cart!');
}

// Remove item from cart
function removeFromCart(itemName) {
    let cart = getCart();
    cart = cart.filter(item => item.name !== itemName);
    saveCart(cart);
    showNotification('🗑️ Item removed from cart');
}

// Update item quantity
function updateQuantity(itemName, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.name === itemName);
    
    if (itemIndex !== -1) {
        cart[itemIndex].quantity += change;
        
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        
        saveCart(cart);
        
        // If on cart page, refresh display
        if (window.location.pathname.includes('Cartpage.html')) {
            displayCart();
        }
    }
}

// Clear entire cart
function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
    showNotification('🛒 Cart cleared');
}

// Get cart total
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Get cart item count
function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// Update cart count display in navbar
function updateCartCount() {
    const count = getCartCount();
    const cartCountElements = document.querySelectorAll('.cart-count, #cart-count');
    
    cartCountElements.forEach(element => {
        element.textContent = count;
        element.style.display = count > 0 ? 'flex' : 'none';
    });
}

// Show notification
function showNotification(message, type = 'success') {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 12px 24px;
        border-radius: 5px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    // Add animation styles if not present
    if (!document.getElementById('cart-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'cart-animation-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .cart-count {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ff6b6b;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
});
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
  const imgSrc = item.image
    ? item.image
    : 'https://via.placeholder.com/150';

  return `
   <div class="food-card">
      <img src="${imgSrc}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p class="price">₹${item.price}</p>
      <button 
        class="add-btn"
        data-id="${item._id}">
        Add to Cart
      </button>
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


// ========== ORDER MANAGEMENT ==========

// Generate unique user ID
const userId = 'user_' + Date.now();

// Create new order
async function createOrder(orderData) {
    try {
        const response = await fetch(`${BASE_URL}/api/orders/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) throw new Error('Failed to create order');
        
        const order = await response.json();
        return order;
    } catch (error) {
        console.error('Order creation error:', error);
        throw error;
    }
}

// Get active order
async function getActiveOrder() {
    const orderId = localStorage.getItem('activeOrderId');
    if (!orderId) return null;
    
    try {
        const response = await fetch(`${BASE_URL}/api/orders/active/${userId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}

// Cancel order
async function cancelOrder(orderId) {
    try {
        const response = await fetch(`${BASE_URL}/api/orders/cancel/${orderId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Cannot cancel order');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Order cancellation error:', error);
        throw error;
    }
}

// ========== WEBSOCKET FOR REAL-TIME UPDATES ==========

let ws = null;
let wsCallbacks = {};

function initializeWebSocket(orderId) {
    const wsUrl = 'wss://bbbackend-bng2.onrender.com'; // Your Render WebSocket URL
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Trigger callbacks based on message type
        if (data.type === 'ORDER_UPDATED' && data.order._id === orderId) {
            if (wsCallbacks.onOrderUpdate) wsCallbacks.onOrderUpdate(data.order);
        } else if (data.type === 'ORDER_DELETED' && data.orderId === orderId) {
            if (wsCallbacks.onOrderDelete) wsCallbacks.onOrderDelete(data.reason);
        } else if (data.type === 'ORDER_CANCELLED' && data.orderId === orderId) {
            if (wsCallbacks.onOrderCancel) wsCallbacks.onOrderCancel();
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after 5 seconds
        setTimeout(() => {
            if (localStorage.getItem('activeOrderId')) {
                initializeWebSocket(localStorage.getItem('activeOrderId'));
            }
        }, 5000);
    };
}

function setWebSocketCallbacks(callbacks) {
    wsCallbacks = { ...wsCallbacks, ...callbacks };
}

function closeWebSocket() {
    if (ws) {
        ws.close();
        ws = null;
    }
}