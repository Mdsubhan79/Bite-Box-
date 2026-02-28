// tracker.js - Global Order Tracker

// Global variables
let activeOrder = null;
let timerInterval = null;
let ws = null;
let isDragging = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

// Initialize tracker on all pages
document.addEventListener('DOMContentLoaded', function() {
    initializeTracker();
});

function initializeTracker() {
    // Check if there's an active order
    const orderId = localStorage.getItem('activeOrderId');
    
    if (orderId) {
        // Show tracker
        const tracker = document.getElementById('floatingTracker');
        if (tracker) {
            tracker.style.display = 'flex';
        }
        
        // Load order details
        loadActiveOrder();
        
        // Initialize WebSocket
        initializeWebSocket(orderId);
        
        // Setup draggable functionality
        setupDraggable();
        
        // Setup popup close button
        const closeBtn = document.getElementById('closePopup');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.getElementById('trackerPopup').classList.remove('active');
            });
        }
        
        // Setup cancel button
        const cancelBtn = document.getElementById('cancelOrderBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelOrder);
        }
        
        // Setup reorder button
        const reorderBtn = document.getElementById('reorderBtn');
        if (reorderBtn) {
            reorderBtn.addEventListener('click', reorder);
        }
    }
}

// Load active order from API
async function loadActiveOrder() {
    const orderId = localStorage.getItem('activeOrderId');
    const userId = localStorage.getItem('userId') || 'user_' + Date.now();
    
    if (!orderId) return;
    
    try {
        const response = await fetch(`https://bbbackend-bng2.onrender.com/api/orders/active/${userId}`);
        const order = await response.json();
        
        if (order) {
            activeOrder = order;
            updateOrderPopup(order);
        } else {
            // No active order found
            localStorage.removeItem('activeOrderId');
            hideTracker();
        }
    } catch (error) {
        console.error('Error loading order:', error);
    }
}

// Update popup with order details
function updateOrderPopup(order) {
    activeOrder = order;
    const progressFill = document.getElementById('progressFill');
    const progressSteps = document.getElementById('progressSteps');
    const orderDetails = document.getElementById('orderDetails');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const adminMessage = document.getElementById('adminMessage');
    
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
    
    // Show admin message if exists
    if (order.adminNotes) {
        adminMessage.style.display = 'block';
        adminMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${order.adminNotes}`;
    } else {
        adminMessage.style.display = 'none';
    }
    
    // Update cancellation timer
    updateCancellationTimer(order);
    
    // Hide tracker if order is delivered
    if (order.orderStatus === 'delivered') {
        setTimeout(() => {
            hideTracker();
        }, 10000); // Hide after 10 seconds
    }
    
    // Show reorder button if order is cancelled
    const reorderBtn = document.getElementById('reorderBtn');
    if (order.orderStatus === 'cancelled') {
        cancelBtn.style.display = 'none';
        reorderBtn.style.display = 'block';
    } else {
        cancelBtn.style.display = 'block';
        reorderBtn.style.display = 'none';
    }
}

// Update cancellation timer
function updateCancellationTimer(order) {
    const timerElement = document.getElementById('cancellationTimer');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    
    if (!timerElement || !cancelBtn) return;
    
    if (!order.cancellationDeadline) {
        timerElement.innerHTML = '';
        return;
    }
    
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

// Initialize WebSocket for real-time updates
function initializeWebSocket(orderId) {
    const wsUrl = 'wss://bbbackend-bng2.onrender.com';
    ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ORDER_UPDATED' && data.order._id === orderId) {
            activeOrder = data.order;
            updateOrderPopup(data.order);
        } else if (data.type === 'ORDER_DELETED' && data.orderId === orderId) {
            handleOrderDeletion(data.reason);
        } else if (data.type === 'ORDER_CANCELLED' && data.orderId === orderId) {
            handleOrderCancellation();
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        // Try to reconnect after 5 seconds
        setTimeout(() => {
            if (localStorage.getItem('activeOrderId')) {
                initializeWebSocket(localStorage.getItem('activeOrderId'));
            }
        }, 5000);
    };
}

// Handle order deletion by admin
function handleOrderDeletion(reason) {
    const adminMessage = document.getElementById('adminMessage');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const reorderBtn = document.getElementById('reorderBtn');
    
    if (adminMessage) {
        adminMessage.style.display = 'block';
        adminMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${reason || 'Order cancelled by admin'}`;
    }
    
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (reorderBtn) reorderBtn.style.display = 'block';
    
    clearInterval(timerInterval);
}

// Handle order cancellation
function handleOrderCancellation() {
    const adminMessage = document.getElementById('adminMessage');
    if (adminMessage) {
        adminMessage.style.display = 'block';
        adminMessage.innerHTML = '<i class="fas fa-info-circle"></i> Order cancelled successfully';
    }
    
    setTimeout(() => {
        hideTracker();
    }, 3000);
    
    clearInterval(timerInterval);
}

// Cancel order
async function cancelOrder() {
    const orderId = localStorage.getItem('activeOrderId');
    
    if (!orderId) return;
    
    if (confirm('Are you sure you want to cancel this order?')) {
        try {
            const response = await fetch(`https://bbbackend-bng2.onrender.com/api/orders/cancel/${orderId}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                alert('Order cancelled successfully');
                document.getElementById('trackerPopup').classList.remove('active');
                setTimeout(() => {
                    hideTracker();
                }, 2000);
            } else {
                const data = await response.json();
                alert(data.error || 'Cannot cancel order. Time limit expired.');
            }
        } catch (error) {
            alert('Error cancelling order');
        }
    }
}

// Reorder
function reorder() {
    if (activeOrder && activeOrder.items) {
        localStorage.setItem('cart', JSON.stringify(activeOrder.items));
        window.location.href = 'orderdetail.html';
    }
}

// Hide tracker
function hideTracker() {
    const tracker = document.getElementById('floatingTracker');
    if (tracker) {
        tracker.style.display = 'none';
    }
    localStorage.removeItem('activeOrderId');
    if (ws) {
        ws.close();
    }
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

// Setup draggable functionality
function setupDraggable() {
    const tracker = document.getElementById('floatingTracker');
    if (!tracker) return;
    
    tracker.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Click tracker to show popup
    tracker.addEventListener('click', (e) => {
        if (!isDragging) {
            document.getElementById('trackerPopup').classList.toggle('active');
        }
    });
}

function dragStart(e) {
    const tracker = document.getElementById('floatingTracker');
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
    tracker.style.cursor = 'grabbing';
}

function dragEnd() {
    isDragging = false;
    const tracker = document.getElementById('floatingTracker');
    tracker.style.cursor = 'grab';
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        const tracker = document.getElementById('floatingTracker');
        tracker.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
}

// Make functions global
window.updateOrderPopup = updateOrderPopup;
window.cancelOrder = cancelOrder;
window.reorder = reorder;