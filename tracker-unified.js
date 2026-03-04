

(function() {
    'use strict';
    
    const API_BASE = "https://bbbackend-bng2.onrender.com";
   
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracker);
    } else {
        initTracker();
    }
    
 
    window.addEventListener('storage', function(e) {
        if (e.key === 'activeOrderId') {
            initTracker();
        }
    });
    
    function initTracker() {
        const orderId = localStorage.getItem('activeOrderId');
        
      
        if (!orderId) {
            removeTracker();
            return;
        }
        
    
        if (!document.getElementById('floatingTracker')) {
            createTrackerElements();
        }
        
        initializeTracker(orderId);
    }
    
    function removeTracker() {
        const tracker = document.getElementById('floatingTracker');
        const popup = document.getElementById('trackerPopup');
        
        if (tracker) tracker.remove();
        if (popup) popup.remove();
    }
    
    function createTrackerElements() {
      
        const tracker = document.createElement('div');
        tracker.id = 'floatingTracker';
        tracker.className = 'floating-tracker';
        tracker.innerHTML = '<i class="fas fa-utensils"></i>';
        document.body.appendChild(tracker);
        
       
        const popup = document.createElement('div');
        popup.id = 'trackerPopup';
        popup.className = 'tracker-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <span><i class="fas fa-shopping-bag"></i> Your Order</span>
                <button id="closePopup"><i class="fas fa-times"></i></button>
            </div>
            <div class="popup-content">
                <div class="timer" id="cancellationTimer"></div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                </div>
                <div class="progress-steps" id="progressSteps"></div>
                <div id="orderDetails" style="margin: 20px 0;"></div>
                <div class="admin-message" id="adminMessage"></div>
                <button class="cancel-btn" id="cancelOrderBtn">
                    <i class="fas fa-times-circle"></i> Cancel Order
                </button>
                <button class="reorder-btn" id="reorderBtn">
                    <i class="fas fa-redo-alt"></i> Reorder Now
                </button>
            </div>
        `;
        document.body.appendChild(popup);
    }
    
  
    let trackerInterval = null;
    let trackerWS = null;
    let activeOrder = null;
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    let xOffset = 0, yOffset = 0;
    
    function initializeTracker(orderId) {
        const tracker = document.getElementById('floatingTracker');
        const popup = document.getElementById('trackerPopup');
        const closeBtn = document.getElementById('closePopup');
        const cancelBtn = document.getElementById('cancelOrderBtn');
        const reorderBtn = document.getElementById('reorderBtn');
        
        if (!tracker) return;
        
        tracker.style.display = 'flex';
        
  
        loadOrderDetails(orderId);
        initializeWebSocket(orderId);
        
       
        if (tracker) {
            tracker.addEventListener('click', function(e) {
                e.stopPropagation();
                if (popup) popup.classList.toggle('active');
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                if (popup) popup.classList.remove('active');
            });
        }
        
        // Close popup when clicking outside
        document.addEventListener('click', function(e) {
            if (popup && popup.classList.contains('active') && 
                !popup.contains(e.target) && 
                !tracker.contains(e.target)) {
                popup.classList.remove('active');
            }
        });
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelOrder);
        }
        
        if (reorderBtn) {
            reorderBtn.addEventListener('click', reorderItems);
        }
        
        // Make tracker draggable
        makeDraggable(tracker);
        
        // Clean up on page unload
        window.addEventListener('beforeunload', cleanupTracker);
    }
    
    // Load order details from API
    async function loadOrderDetails(orderId) {
        try {
            const response = await fetch(`${API_BASE}/api/orders/${orderId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const order = await response.json();
            
            if (order) {
                activeOrder = order;
                updatePopup(order);
                startCancellationTimer(order);
            } else {
                localStorage.removeItem('activeOrderId');
                removeTracker();
            }
        } catch (error) {
            console.error('Error loading order:', error);
            updatePopupFromLocal(orderId);
        }
    }
    
    function updatePopupFromLocal(orderId) {
        const orderDetails = document.getElementById('orderDetails');
        
        if (orderDetails && orderId) {
            orderDetails.innerHTML = `
                <p><strong>Order ID:</strong> #${orderId.slice(-6)}</p>
                <p><strong>Status:</strong> Pending</p>
                <p><i>Loading details...</i></p>
            `;
        }
    }
    
    function updatePopup(order) {
        const orderDetails = document.getElementById('orderDetails');
        const progressFill = document.getElementById('progressFill');
        const progressSteps = document.getElementById('progressSteps');
        const adminMessage = document.getElementById('adminMessage');
        const cancelBtn = document.getElementById('cancelOrderBtn');
        const reorderBtn = document.getElementById('reorderBtn');
        const timerElement = document.getElementById('cancellationTimer');
        
        if (!orderDetails) return;
        
        const itemsCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        
        orderDetails.innerHTML = `
            <p><strong>Items:</strong> ${itemsCount}</p>
            <p><strong>Total:</strong> ₹${order.totalAmount || 0}</p>
            <p><strong>Status:</strong> ${(order.orderStatus || 'pending').replace(/-/g, ' ')}</p>
            <p><strong>Payment:</strong> ${order.paymentStatus || 'pending'}</p>
            <p><strong>Delivery:</strong> ${order.deliveryEstimate || '25-30 minutes'}</p>
        `;
        
        // Update progress bar
        if (progressFill) {
            const progressMap = {
                'pending': 20,
                'confirmed': 40,
                'preparing': 60,
                'out-for-delivery': 80,
                'delivered': 100,
                'cancelled': 0
            };
            progressFill.style.width = `${progressMap[order.orderStatus] || 0}%`;
        }
        
        // Update steps
        if (progressSteps) {
            const steps = ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
            const statusMap = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered'];
            
            let stepsHtml = '';
            steps.forEach((step, index) => {
                const isActive = order.orderStatus === statusMap[index] || 
                                (index < statusMap.indexOf(order.orderStatus) && order.orderStatus !== 'cancelled');
                stepsHtml += `<div class="step ${isActive ? 'active' : ''}">${step}</div>`;
            });
            progressSteps.innerHTML = stepsHtml;
        }
        
        // Show admin message
        if (adminMessage) {
            if (order.adminNotes) {
                adminMessage.style.display = 'block';
                adminMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${order.adminNotes}`;
            } else {
                adminMessage.style.display = 'none';
            }
        }
        
        // Show/hide buttons based on status
        if (cancelBtn && reorderBtn) {
            if (order.orderStatus === 'cancelled' || order.orderStatus === 'delivered') {
                cancelBtn.style.display = 'none';
                if (order.orderStatus === 'cancelled') {
                    reorderBtn.style.display = 'block';
                } else {
                    reorderBtn.style.display = 'none';
                }
            } else {
                cancelBtn.style.display = 'block';
                reorderBtn.style.display = 'none';
            }
        }
        
        // Hide timer for delivered/cancelled orders
        if (timerElement && (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled')) {
            timerElement.style.display = 'none';
        }
    }
    
    function startCancellationTimer(order) {
        const timerElement = document.getElementById('cancellationTimer');
        const cancelBtn = document.getElementById('cancelOrderBtn');
        
        if (!timerElement || !cancelBtn || !order.cancellationDeadline) return;
        
        timerElement.style.display = 'block';
        const deadline = new Date(order.cancellationDeadline);
        
        function updateTimer() {
            const now = new Date();
            const timeLeft = deadline - now;
            
            if (timeLeft <= 0) {
                timerElement.innerHTML = '⏰ Cancellation time expired';
                cancelBtn.disabled = true;
                if (trackerInterval) {
                    clearInterval(trackerInterval);
                    trackerInterval = null;
                }
            } else {
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                timerElement.innerHTML = `⏱️ Cancel within: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                cancelBtn.disabled = false;
            }
        }
        
        updateTimer();
        trackerInterval = setInterval(updateTimer, 1000);
    }
    
    function initializeWebSocket(orderId) {
        const wsUrl = 'wss://bbbackend-bng2.onrender.com';
        trackerWS = new WebSocket(wsUrl);
        
        trackerWS.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'ORDER_UPDATED' && data.order._id === orderId) {
                    activeOrder = data.order;
                    updatePopup(data.order);
                } else if (data.type === 'ORDER_DELETED' && data.orderId === orderId) {
                    const adminMessage = document.getElementById('adminMessage');
                    const cancelBtn = document.getElementById('cancelOrderBtn');
                    const reorderBtn = document.getElementById('reorderBtn');
                    
                    if (adminMessage) {
                        adminMessage.style.display = 'block';
                        adminMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${data.reason || 'Order cancelled by admin'}`;
                    }
                    if (cancelBtn) cancelBtn.style.display = 'none';
                    if (reorderBtn) reorderBtn.style.display = 'block';
                    
                    if (trackerInterval) {
                        clearInterval(trackerInterval);
                        trackerInterval = null;
                    }
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };
        
        trackerWS.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        trackerWS.onclose = () => {
            // Try to reconnect after 5 seconds
            setTimeout(() => {
                if (localStorage.getItem('activeOrderId')) {
                    initializeWebSocket(localStorage.getItem('activeOrderId'));
                }
            }, 5000);
        };
    }
    
// Cancel order function - FIXED VERSION
async function cancelOrder() {
    const orderId = localStorage.getItem('activeOrderId');
    
    if (!orderId) {
        alert('No active order found');
        return;
    }
    
    if (!confirm('Are you sure you want to cancel this order? You can only cancel within 5 minutes of placing the order.')) {
        return;
    }
    
    // Show loading state on cancel button
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const originalText = cancelBtn ? cancelBtn.innerHTML : 'Cancel Order';
    if (cancelBtn) {
        cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
        cancelBtn.disabled = true;
    }
    
    try {
        console.log('Cancelling order:', orderId); // Debug log
        
        const response = await fetch(`${API_BASE}/api/orders/cancel/${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Log response for debugging
        console.log('Cancel response status:', response.status);
        
        const data = await response.json();
        console.log('Cancel response data:', data);
        
        if (response.ok) {
            alert('✅ Order cancelled successfully');
            
            // Update UI
            const popup = document.getElementById('trackerPopup');
            const tracker = document.getElementById('floatingTracker');
            const orderDetails = document.getElementById('orderDetails');
            
            if (orderDetails) {
                orderDetails.innerHTML = '<p style="color: #dc3545; text-align: center;">Order has been cancelled</p>';
            }
            
            // Update progress bar
            const progressFill = document.getElementById('progressFill');
            if (progressFill) progressFill.style.width = '0%';
            
            // Hide cancel button, show reorder button
            const reorderBtn = document.getElementById('reorderBtn');
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (reorderBtn) {
                reorderBtn.style.display = 'block';
                reorderBtn.onclick = () => {
                    if (activeOrder && activeOrder.items) {
                        localStorage.setItem('cart', JSON.stringify(activeOrder.items));
                        window.location.href = 'orderdetail.html';
                    }
                };
            }
            
            // Hide timer
            const timerElement = document.getElementById('cancellationTimer');
            if (timerElement) timerElement.style.display = 'none';
            
            // Remove order ID from localStorage after 2 seconds
            setTimeout(() => {
                localStorage.removeItem('activeOrderId');
                if (tracker) {
                    tracker.style.display = 'none';
                }
                if (popup) {
                    popup.classList.remove('active');
                }
            }, 3000);
            
        } else {
            // Handle specific error messages
            let errorMessage = data.error || 'Cannot cancel order';
            
            if (response.status === 400) {
                if (errorMessage.includes('time')) {
                    errorMessage = '⏰ Cancellation time expired (5 minutes limit)';
                }
            } else if (response.status === 404) {
                errorMessage = 'Order not found';
                localStorage.removeItem('activeOrderId');
            }
            
            alert('❌ ' + errorMessage);
            
            // Reset button
            if (cancelBtn) {
                cancelBtn.innerHTML = originalText;
                cancelBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('❌ Network error. Please check your connection and try again.');
        
        // Reset button
        if (cancelBtn) {
            cancelBtn.innerHTML = originalText;
            cancelBtn.disabled = false;
        }
    }
}
    
    function reorderItems() {
        if (activeOrder && activeOrder.items) {
            localStorage.setItem('cart', JSON.stringify(activeOrder.items));
            window.location.href = 'orderdetail.html';
        }
    }
    
    function makeDraggable(element) {
        if (!element) return;
        
        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }
    
    function dragStart(e) {
        const element = document.getElementById('floatingTracker');
        if (!element) return;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
        element.style.cursor = 'grabbing';
        e.preventDefault();
    }
    
    function dragEnd() {
        const element = document.getElementById('floatingTracker');
        if (!element) return;
        
        isDragging = false;
        element.style.cursor = 'grab';
    }
    
    function drag(e) {
        const element = document.getElementById('floatingTracker');
        if (!element || !isDragging) return;
        
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        
        element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
    
    function cleanupTracker() {
        if (trackerInterval) {
            clearInterval(trackerInterval);
            trackerInterval = null;
        }
        if (trackerWS) {
            trackerWS.close();
            trackerWS = null;
        }
    }
})();