const API_BASE = "https://bbbackend-bng2.onrender.com";
const cart = getCart();
let activeOrder = null;
let timerInterval = null;

// ========== ORDER CREATION FUNCTIONS ==========

async function createOrder(orderData) {
    const response = await fetch(`${API_BASE}/api/orders/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
    }
    
    return await response.json();
}

async function getActiveOrder() {
    const userId = localStorage.getItem('userId') || 'guest';
    try {
        const response = await fetch(`${API_BASE}/api/orders/active/${userId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error getting active order:', error);
        return null;
    }
}

// ========== DISPLAY FUNCTIONS ==========

function displayOrderItems() {
    const container = document.getElementById('orderItems');
    if (!container) return;
    
    let total = 0;
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty. <a href="veg.html">Browse items</a></p>';
        document.getElementById('totalPrice').innerHTML = 'Total: ₹0';
        const orderBtn = document.querySelector('.order-now-btn');
        if (orderBtn) orderBtn.disabled = true;
        return;
    }
    
    container.innerHTML = '';
    cart.forEach((item) => {
        const quantity = item.quantity || 1;
        const itemTotal = item.price * quantity;
        total += itemTotal;
        
        container.innerHTML += `
            <div class="order-item">
                <div>
                    <strong>${item.name}</strong>
                    <br>
                    <small>₹${item.price} × ${quantity}</small>
                </div>
                <div>
                    <strong>₹${itemTotal}</strong>
                </div>
            </div>
        `;
    });
    
    document.getElementById('totalPrice').innerHTML = `Total: ₹${total}`;
    localStorage.setItem('orderTotal', total);
}

// ========== TRACKER POPUP FUNCTIONS ==========

function updateOrderPopup(order) {
    activeOrder = order;
    const progressFill = document.getElementById('progressFill');
    const progressSteps = document.getElementById('progressSteps');
    const orderDetails = document.getElementById('orderDetails');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    
    if (!progressFill || !progressSteps || !orderDetails) return;
    
    // Update progress bar
    const progressMap = {
        'pending': 20,
        'confirmed': 40,
        'preparing': 60,
        'out-for-delivery': 80,
        'delivered': 100,
        'cancelled': 0
    };
    
    progressFill.style.width = `${progressMap[order.orderStatus] || 0}%`;
    
    // Update steps
    const steps = ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
    const statusMap = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered'];
    
    let stepsHtml = '';
    steps.forEach((step, index) => {
        const isActive = order.orderStatus === statusMap[index] || 
                        (index < statusMap.indexOf(order.orderStatus) && order.orderStatus !== 'cancelled');
        stepsHtml += `<div class="step ${isActive ? 'active' : ''}">${step}</div>`;
    });
    progressSteps.innerHTML = stepsHtml;
    
    // Update order details
    orderDetails.innerHTML = `
        <p><i class="fas fa-box"></i> <strong>Items:</strong> ${order.items?.length || 0}</p>
        <p><i class="fas fa-rupee-sign"></i> <strong>Total:</strong> ₹${order.totalAmount || 0}</p>
        <p><i class="fas fa-clock"></i> <strong>Status:</strong> ${(order.orderStatus || 'pending').replace(/-/g, ' ')}</p>
        <p><i class="fas fa-credit-card"></i> <strong>Payment:</strong> ${order.paymentStatus || 'pending'}</p>
        <p><i class="fas fa-motorcycle"></i> <strong>Delivery:</strong> ${order.deliveryEstimate || '25-30 minutes'}</p>
    `;
    
    // Show/hide admin message
    const adminMessage = document.getElementById('adminMessage');
    if (adminMessage && order.adminNotes) {
        adminMessage.style.display = 'block';
        adminMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${order.adminNotes}`;
    }
    
    // Update cancellation timer
    updateCancellationTimer(order);
}

function updateCancellationTimer(order) {
    const timerElement = document.getElementById('cancellationTimer');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    
    if (!timerElement || !cancelBtn) return;
    
    // Hide timer for delivered/cancelled orders
    if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
        timerElement.style.display = 'none';
        cancelBtn.style.display = 'none';
        return;
    }
    
    if (!order.cancellationDeadline) return;
    
    timerElement.style.display = 'block';
    const deadline = new Date(order.cancellationDeadline);
    
    function updateTimer() {
        const now = new Date();
        const timeLeft = deadline - now;
        
        if (timeLeft <= 0) {
            timerElement.innerHTML = '⏰ Cancellation time expired';
            cancelBtn.disabled = true;
            clearInterval(timerInterval);
        } else {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            timerElement.innerHTML = `⏱️ Cancel within: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            cancelBtn.disabled = false;
        }
    }
    
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// ========== ORDER CANCELLATION HANDLING ==========

function handleOrderDeletion(reason) {
    const adminMessage = document.getElementById('adminMessage');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const reorderBtn = document.getElementById('reorderBtn');
    
    if (!adminMessage || !cancelBtn || !reorderBtn) return;
    
    adminMessage.style.display = 'block';
    adminMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${reason || 'Order cancelled by admin'}`;
    cancelBtn.style.display = 'none';
    reorderBtn.style.display = 'block';
    
    reorderBtn.onclick = () => {
        if (activeOrder) {
            localStorage.setItem('cart', JSON.stringify(activeOrder.items));
            window.location.href = 'orderdetail.html';
        }
    };
    
    clearInterval(timerInterval);
}

// ========== REORDER FUNCTION ==========

function reorderCancelledItems() {
    // Try to get from activeOrder first
    if (activeOrder && activeOrder.items) {
        localStorage.setItem('cart', JSON.stringify(activeOrder.items));
        window.location.href = 'orderdetail.html';
        return;
    }
    
    // Fallback to lastOrderItems in localStorage
    const lastOrder = localStorage.getItem('lastOrderItems');
    if (lastOrder) {
        localStorage.setItem('cart', lastOrder);
        window.location.href = 'orderdetail.html';
    } else {
        alert('No items to reorder. Please add items to cart first.');
        window.location.href = 'veg.html';
    }
}

// ========== ORDER SUBMISSION ==========

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    // Validate phone
    const phone = document.getElementById('phone').value;
    if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }
    
    // Get or create user ID
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Date.now();
        localStorage.setItem('userId', userId);
    }
    
    const orderData = {
        userId: userId,
        items: cart,
        customerDetails: {
            name: document.getElementById('fullName').value,
            phone: phone,
            address: document.getElementById('address').value,
            landmark: document.getElementById('landmark').value || ''
        },
        totalAmount: parseFloat(localStorage.getItem('orderTotal') || '0')
    };
    
    try {
        const order = await createOrder(orderData);
        
        // Store order info
        localStorage.setItem('activeOrderId', order._id);
        localStorage.setItem('lastOrderItems', JSON.stringify(cart));
        localStorage.removeItem('cart');
        
        alert('✅ Order placed successfully! Track your order using the floating tracker.');
        
        // Show tracker
        const tracker = document.getElementById('floatingTracker');
        if (tracker) {
            tracker.style.display = 'flex';
        }
        
        updateOrderPopup(order);
        
        // Redirect to services page
        setTimeout(() => {
            window.location.href = 'services.html';
        }, 2000);
        
    } catch (error) {
        console.error('Order error:', error);
        alert('Error placing order: ' + error.message);
    }
}

async function handleCancelOrder() {
    const orderId = localStorage.getItem('activeOrderId');
    
    if (!orderId) return;
    
    if (confirm('Are you sure you want to cancel this order?')) {
        try {
            const response = await fetch(`${API_BASE}/api/orders/cancel/${orderId}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                alert('Order cancelled successfully');
                const popup = document.getElementById('trackerPopup');
                const tracker = document.getElementById('floatingTracker');
                
                if (popup) popup.classList.remove('active');
                if (tracker) {
                    setTimeout(() => {
                        tracker.style.display = 'none';
                    }, 2000);
                }
                localStorage.removeItem('activeOrderId');
            } else {
                const data = await response.json();
                alert(data.error || 'Cannot cancel order. Time limit expired.');
            }
        } catch (error) {
            alert('Error cancelling order');
        }
    }
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    displayOrderItems();
    
    // Check for existing active order
    if (localStorage.getItem('activeOrderId')) {
        const tracker = document.getElementById('floatingTracker');
        if (tracker) {
            tracker.style.display = 'flex';
            getActiveOrder().then(order => {
                if (order) {
                    updateOrderPopup(order);
                    if (typeof initializeWebSocket === 'function') {
                        initializeWebSocket(order._id);
                    }
                }
            });
        }
    }
    
    // Setup form submission
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
    
    // Setup cancel button
    const cancelBtn = document.getElementById('cancelOrderBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancelOrder);
    }
    
    // Setup close popup button
    const closeBtn = document.getElementById('closePopup');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const popup = document.getElementById('trackerPopup');
            if (popup) popup.classList.remove('active');
        });
    }
});

// ========== CLEANUP ==========

window.addEventListener('beforeunload', () => {
    if (timerInterval) clearInterval(timerInterval);
});

// ========== EXPORT FUNCTIONS TO GLOBAL SCOPE ==========

window.reorderCancelledItems = reorderCancelledItems;
window.getActiveOrder = getActiveOrder;
window.updateOrderPopup = updateOrderPopup;