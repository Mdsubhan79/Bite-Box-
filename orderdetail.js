// orderdetail.js

// Get cart from localStorage using script.js functions
const cart = getCart();
let activeOrder = null;
let timerInterval = null;

// Display order items
function displayOrderItems() {
    const container = document.getElementById('orderItems');
    let total = 0;
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty. <a href="veg.html">Browse items</a></p>';
        document.getElementById('totalPrice').innerHTML = 'Total: ₹0';
        document.querySelector('.order-now-btn').disabled = true;
        return;
    }
    
    container.innerHTML = '';
    cart.forEach((item, index) => {
        const itemTotal = item.price * (item.quantity || 1);
        total += itemTotal;
        
        container.innerHTML += `
            <div class="order-item">
                <div>
                    <strong>${item.name}</strong>
                    <br>
                    <small>₹${item.price} × ${item.quantity || 1}</small>
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

// Update popup with order details
function updateOrderPopup(order) {
    activeOrder = order;
    const progressFill = document.getElementById('progressFill');
    const progressSteps = document.getElementById('progressSteps');
    const orderDetails = document.getElementById('orderDetails');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    
    // Update progress bar
    const progressMap = {
        'pending': 20,
        'confirmed': 40,
        'preparing': 60,
        'out-for-delivery': 80,
        'delivered': 100
    };
    
    progressFill.style.width = `${progressMap[order.orderStatus] || 0}%`;
    
    // Update steps
    const steps = ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
    const statusMap = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered'];
    
    let stepsHtml = '';
    steps.forEach((step, index) => {
        const isActive = order.orderStatus === statusMap[index] || 
                        (index < statusMap.indexOf(order.orderStatus));
        stepsHtml += `<div class="step ${isActive ? 'active' : ''}">${step}</div>`;
    });
    progressSteps.innerHTML = stepsHtml;
    
    // Update order details
    orderDetails.innerHTML = `
        <p><i class="fas fa-box"></i> <strong>Items:</strong> ${order.items.length}</p>
        <p><i class="fas fa-rupee-sign"></i> <strong>Total:</strong> ₹${order.totalAmount}</p>
        <p><i class="fas fa-clock"></i> <strong>Status:</strong> ${order.orderStatus.replace(/-/g, ' ')}</p>
        <p><i class="fas fa-credit-card"></i> <strong>Payment:</strong> ${order.paymentStatus}</p>
        <p><i class="fas fa-motorcycle"></i> <strong>Delivery:</strong> ${order.deliveryEstimate || '25-30 minutes'}</p>
    `;
    
    // Update cancellation timer
    updateCancellationTimer(order);
}

// Update cancellation timer
function updateCancellationTimer(order) {
    const timerElement = document.getElementById('cancellationTimer');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    
    if (!order.cancellationDeadline) return;
    
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

// Handle order deletion by admin
function handleOrderDeletion(reason) {
    const adminMessage = document.getElementById('adminMessage');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const reorderBtn = document.getElementById('reorderBtn');
    
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

// Make tracker draggable
const tracker = document.getElementById('floatingTracker');
let isDragging = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

tracker.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
    tracker.style.cursor = 'grabbing';
}

function dragEnd() {
    isDragging = false;
    tracker.style.cursor = 'grab';
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        tracker.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
}

// Click tracker to show popup
tracker.addEventListener('click', (e) => {
    if (!isDragging) {
        document.getElementById('trackerPopup').classList.toggle('active');
    }
});

// Close popup
document.getElementById('closePopup').addEventListener('click', () => {
    document.getElementById('trackerPopup').classList.remove('active');
});

// Cancel order
document.getElementById('cancelOrderBtn').addEventListener('click', async () => {
    const orderId = localStorage.getItem('activeOrderId');
    
    if (confirm('Are you sure you want to cancel this order?')) {
        try {
            await cancelOrder(orderId);
            alert('Order cancelled successfully');
            document.getElementById('trackerPopup').classList.remove('active');
            setTimeout(() => {
                tracker.style.display = 'none';
            }, 2000);
        } catch (error) {
            alert(error.message || 'Error cancelling order');
        }
    }
});

// Handle form submission
document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate phone
    const phone = document.getElementById('phone').value;
    if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }
    
    const orderData = {
        userId: 'user_' + Date.now(),
        items: cart,
        customerDetails: {
            name: document.getElementById('fullName').value,
            phone: phone,
            address: document.getElementById('address').value,
            landmark: document.getElementById('landmark').value
        },
        totalAmount: parseFloat(localStorage.getItem('orderTotal'))
    };
    
    try {
        const order = await createOrder(orderData);
        
        // Store order info
        localStorage.setItem('activeOrderId', order._id);
        localStorage.setItem('lastOrderItems', JSON.stringify(cart));
        localStorage.removeItem('cart');
        
        alert('✅ Order placed successfully! Track your order using the floating tracker.');
        
        // Show tracker and setup WebSocket
        tracker.style.display = 'flex';
        updateOrderPopup(order);
        
        // Setup WebSocket for real-time updates
        initializeWebSocket(order._id);
        setWebSocketCallbacks({
            onOrderUpdate: updateOrderPopup,
            onOrderDelete: handleOrderDeletion,
            onOrderCancel: () => {
                alert('Order was cancelled');
                tracker.style.display = 'none';
                document.getElementById('trackerPopup').classList.remove('active');
            }
        });
        
    } catch (error) {
        alert('Error placing order. Please try again.');
    }
});

// Initialize page
displayOrderItems();

// Check for existing active order
if (localStorage.getItem('activeOrderId')) {
    tracker.style.display = 'flex';
    getActiveOrder().then(order => {
        if (order) {
            updateOrderPopup(order);
            initializeWebSocket(order._id);
            setWebSocketCallbacks({
                onOrderUpdate: updateOrderPopup,
                onOrderDelete: handleOrderDeletion
            });
        }
    });
}

// Clean up
window.addEventListener('beforeunload', () => {
    if (timerInterval) clearInterval(timerInterval);
    closeWebSocket();
});