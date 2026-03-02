
(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracker);
    } else {
        initTracker();
    }
    
    function initTracker() {
        // Check if tracker already exists (prevent duplicates)
        if (document.getElementById('floatingTracker')) {
            return;
        }
        
        // Only show tracker if there's an active order
        const orderId = localStorage.getItem('activeOrderId');
        if (!orderId) {
            return;
        }
        
        // Create tracker HTML
        createTrackerElements();
        
       
        initializeTracker();
    }
    
    function createTrackerElements() {
        // Create floating tracker button
        const tracker = document.createElement('div');
        tracker.id = 'floatingTracker';
        tracker.className = 'floating-tracker';
        tracker.innerHTML = '<i class="fas fa-utensils"></i>';
        document.body.appendChild(tracker);
        
        // Create tracker popup
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
    
    // Variables
    let trackerInterval = null;
    let trackerWS = null;
    let activeOrder = null;
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    let xOffset = 0, yOffset = 0;
    
    function initializeTracker() {
        const tracker = document.getElementById('floatingTracker');
        const popup = document.getElementById('trackerPopup');
        const closeBtn = document.getElementById('closePopup');
        const cancelBtn = document.getElementById('cancelOrderBtn');
        const reorderBtn = document.getElementById('reorderBtn');
        
        if (!tracker) return;
        
        // Check for active order
        const orderId = localStorage.getItem('activeOrderId');
        const userData = localStorage.getItem('biteboxUser');
        const userId = userData ? JSON.parse(userData).email : 'guest';
        
        if (orderId) {
            tracker.style.display = 'flex';
            loadOrderDetails(orderId, userId);
            initializeWebSocket(orderId);
        } else {
            tracker.style.display = 'none';
            return;
        }
        
        // Event Listeners
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
    async function loadOrderDetails(orderId, userId) {
        try {
            const response = await fetch(`https://bbbackend-bng2.onrender.com/api/orders/active/${userId}`);
            const order = await response.json();
            
            if (order) {
                activeOrder = order;
                updatePopup(order);
                startCancellationTimer(order);
            } else {
                // No active order found
                localStorage.removeItem('activeOrderId');
                hideTracker();
            }
        } catch (error) {
            console.error('Error loading order:', error);
            // If API fails, show limited info
            updatePopupFromLocal();
        }
    }
    
    function updatePopupFromLocal() {
        const orderDetails = document.getElementById('orderDetails');
        const orderId = localStorage.getItem('activeOrderId');
        
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
        const tracker = document.getElementById('floatingTracker');
        
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
        
        // Hide tracker after delivery
        if (order.orderStatus === 'delivered' && tracker) {
            setTimeout(() => {
                tracker.style.display = 'none';
                localStorage.removeItem('activeOrderId');
            }, 10000);
        }
    }
    
    function startCancellationTimer(order) {
        const timerElement = document.getElementById('cancellationTimer');
        const cancelBtn = document.getElementById('cancelOrderBtn');
        
        if (!timerElement || !order.cancellationDeadline) return;
        
        const deadline = new Date(order.cancellationDeadline);
        
        function updateTimer() {
            const now = new Date();
            const timeLeft = deadline - now;
            
            if (timeLeft <= 0) {
                timerElement.innerHTML = '⏰ Cancellation time expired';
                if (cancelBtn) cancelBtn.disabled = true;
                if (trackerInterval) {
                    clearInterval(trackerInterval);
                    trackerInterval = null;
                }
            } else {
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                timerElement.innerHTML = `⏱️ Cancel within: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                if (cancelBtn) cancelBtn.disabled = false;
            }
        }
        
        updateTimer();
        trackerInterval = setInterval(updateTimer, 1000);
    }
    
    function initializeWebSocket(orderId) {
        const wsUrl = 'wss://bbbackend-bng2.onrender.com';
        trackerWS = new WebSocket(wsUrl);
        
        trackerWS.onmessage = (event) => {
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
                    const popup = document.getElementById('trackerPopup');
                    const tracker = document.getElementById('floatingTracker');
                    
                    if (popup) popup.classList.remove('active');
                    setTimeout(() => {
                        if (tracker) tracker.style.display = 'none';
                        localStorage.removeItem('activeOrderId');
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
    
    function reorderItems() {
        if (activeOrder && activeOrder.items) {
            localStorage.setItem('cart', JSON.stringify(activeOrder.items));
            window.location.href = 'orderdetail.html';
        }
    }
    
    function hideTracker() {
        const tracker = document.getElementById('floatingTracker');
        if (tracker) {
            tracker.style.display = 'none';
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