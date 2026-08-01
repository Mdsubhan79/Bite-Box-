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
const tracker = document.getElementById('floatingTracker');

const saved = localStorage.getItem('trackerPosition');
if (saved && tracker) {
    const pos = JSON.parse(saved);
    xOffset = pos.x;
    yOffset = pos.y;
    tracker.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
}
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
                <button class="reorder-btn" id="reorderBtn" style="display: none;">
                    <i class="fas fa-redo-alt"></i> Reorder Now
                </button>
            </div>
        `;
        document.body.appendChild(popup);
    }
    
    let trackerInterval = null;
    let trackerWS = null;
    let activeOrder = null;
    window.activeOrder = null;
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
        
        makeDraggable(tracker);
        window.addEventListener('beforeunload', cleanupTracker);
    }
    
    async function loadOrderDetails(orderId) {
        try {
            const response = await fetch(`${API_BASE}/api/orders/${orderId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const order = await response.json();
            
            if (order) {
                activeOrder = order;
window.activeOrder = order;
localStorage.setItem('lastOrderItems', JSON.stringify(order.items || []));
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
        
        if (adminMessage) {
            if (order.adminNotes) {
                adminMessage.style.display = 'block';
                adminMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${order.adminNotes}`;
            } else {
                adminMessage.style.display = 'none';
            }
        }
        
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
    
    // SINGLE WebSocket
    function initializeWebSocket(orderId) {
        const wsUrl = 'wss://bbbackend-bng2.onrender.com';
        trackerWS = new WebSocket(wsUrl);
        
        trackerWS.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'ORDER_UPDATED' && data.order._id === orderId) {
                    activeOrder = data.order;
                    updatePopup(data.order);
                    
                    if (data.order.orderStatus === 'delivered') {
                       
                        removeTracker();
                        showDeliveryFeedback(data.order);
                    }
                    
                } else if (data.type === 'ORDER_DELIVERED' && data.orderId === orderId) {
                    removeTracker();
                    showDeliveryFeedback({ _id: orderId });
                    
                }else if (data.type === 'ORDER_CANCELLED' && data.order._id === orderId) {
    localStorage.removeItem('activeOrderId'); 
    removeTracker();
    showCancellationPopup(data.order);
}else if (data.type === 'ORDER_DELETED' && data.orderId === orderId) {
    
    localStorage.removeItem('activeOrderId');
    removeTracker();

  
    console.log("Order deleted by admin (silent)");
}
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };
        
        trackerWS.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        trackerWS.onclose = () => {
            setTimeout(() => {
                if (localStorage.getItem('activeOrderId')) {
                    initializeWebSocket(localStorage.getItem('activeOrderId'));
                }
            }, 5000);
        };
    }
    async function cancelOrder() {
    const orderId = localStorage.getItem('activeOrderId');
    
    if (!orderId) {
        alert('No active order found');
        return;
    }
    
    if (!confirm('Are you sure you want to cancel this order? You can only cancel within 5 minutes of placing the order.')) {
        return;
    }
    
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const originalText = cancelBtn ? cancelBtn.innerHTML : 'Cancel Order';

    if (cancelBtn) {
        cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
        cancelBtn.disabled = true;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/orders/cancel/${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Order cancelled successfully');

            // 🔥 IMPORTANT: clear order
            localStorage.removeItem('activeOrderId');

            // 🔥 remove tracker completely
            removeTracker();

            // 🔥 show cancellation popup
            showCancellationPopup({
                _id: orderId,
                adminNotes: "You cancelled this order"
            });

        } else {
            let errorMessage = data.error || 'Cannot cancel order';
            
            if (response.status === 400 && errorMessage.includes('time')) {
                errorMessage = '⏰ Cancellation time expired (5 minutes limit)';
            } else if (response.status === 404) {
                errorMessage = 'Order not found';
                localStorage.removeItem('activeOrderId');
            }
            
            alert('❌ ' + errorMessage);
            
            if (cancelBtn) {
                cancelBtn.innerHTML = originalText;
                cancelBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('❌ Network error. Please try again.');
        
        if (cancelBtn) {
            cancelBtn.innerHTML = originalText;
            cancelBtn.disabled = false;
        }
    }
}
    
function reorderItems() {
    if (activeOrder && activeOrder.items) {
        localStorage.setItem('cart', JSON.stringify(activeOrder.items));
        window.location.href = 'cart.html';
    } else {
        const lastOrder = localStorage.getItem('lastOrderItems');
        if (lastOrder) {
            localStorage.setItem('cart', lastOrder);
            window.location.href = 'cart.html';
        }
    }
}
    
function makeDraggable(element) {
    if (!element) return;

    
    element.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);


    element.addEventListener('touchstart', dragStart, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);
}

function dragStart(e) {
    e.stopPropagation();

    const element = document.getElementById('floatingTracker');
    if (!element) return;

    isDragging = true;

    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    initialX = clientX - xOffset;
    initialY = clientY - yOffset;

    element.style.cursor = "grabbing";
    // Pause the CSS transition while dragging so movement tracks the
    // pointer 1:1 instead of easing behind it.
    element.style.transition = "none";
}
let animationFrameId = null;

function drag(e) {
    if (!isDragging) return;

    const element = document.getElementById('floatingTracker');
    if (!element) return;

    e.preventDefault(); 

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    currentX = clientX - initialX;
    currentY = clientY - initialY;

    xOffset = currentX;
    yOffset = currentY;

    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    animationFrameId = requestAnimationFrame(() => {
        element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    });
}

function dragEnd() {
    const element = document.getElementById('floatingTracker');
    if (!element) return;

    isDragging = false;
    element.style.cursor = "grab";
    // Hand control back to the stylesheet's transition (hover, breathe, etc.)
    element.style.transition = "";

    localStorage.setItem('trackerPosition', JSON.stringify({
        x: xOffset,
        y: yOffset
    }));
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

// ========== DELIVERY FEEDBACK POPUP ==========

function showDeliveryFeedback(order) {
    const existingPopup = document.getElementById('deliveryFeedbackPopup');
    if (existingPopup) existingPopup.remove();
    
    const feedbackPopup = document.createElement('div');
    feedbackPopup.id = 'deliveryFeedbackPopup';
    feedbackPopup.className = 'status-popup success-popup';
    feedbackPopup.innerHTML = `
        <div class="popup-content">
            <div class="success-animation">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Order Delivered!</h2>
            <p>Your order has been delivered successfully.</p>
            <p class="order-id">Order #${order._id.slice(-6)}</p>
            
            <div class="rating-section">
                <p>How was your experience?</p>
                <div class="rating-buttons">
                    <button onclick="rateOrder(1)">😡</button>
                    <button onclick="rateOrder(2)">😕</button>
                    <button onclick="rateOrder(3)">😐</button>
                    <button onclick="rateOrder(4)">😊</button>
                    <button onclick="rateOrder(5)">🤩</button>
                </div>
            </div>
            
            <textarea id="feedbackText" placeholder="Tell us about your experience..." rows="3"></textarea>
            
            <div class="popup-buttons">
                <button onclick="submitFeedback('${order._id}')" class="btn-primary">Submit Feedback</button>
                <button onclick="closeFeedbackPopup()" class="btn-secondary">Close</button>
            </div>
            
            <div class="enquiry-section">
                <p>Not delivered yet? Having issues?</p>
                <button onclick="contactSupport('${order._id}')" class="btn-enquiry">
                    <i class="fas fa-headset"></i> Contact Support
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(feedbackPopup);
    
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.onclick = closeFeedbackPopup;
    document.body.appendChild(overlay);
}

// ========== CANCELLATION POPUP ==========

function showCancellationPopup(order) {
    const existingPopup = document.getElementById('cancellationPopup');
    if (existingPopup) existingPopup.remove();
    
    const cancelPopup = document.createElement('div');
    cancelPopup.id = 'cancellationPopup';
    cancelPopup.className = 'status-popup cancelled-popup';
    cancelPopup.innerHTML = `
        <div class="popup-content">
            <div class="cancelled-animation">
                <i class="fas fa-times-circle"></i>
            </div>
            <h2>Order Cancelled</h2>
            <p>Your order has been cancelled.</p>
            <p class="order-id">Order #${order._id.slice(-6)}</p>
            
            <div class="reason-section">
                <strong>Reason:</strong>
                <p>${order.adminNotes || 'No reason provided'}</p>
            </div>
            
            <div class="popup-buttons">
                <button onclick="reorderCancelledItems()" class="btn-primary">
                    <i class="fas fa-redo-alt"></i> Reorder Now
                </button>
                <button onclick="closeCancellationPopup()" class="btn-secondary">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
            
            <div class="enquiry-section">
                <p>Need help with cancellation?</p>
                <button onclick="contactSupport('${order._id}')" class="btn-enquiry">
                    <i class="fas fa-headset"></i> Contact Support
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(cancelPopup);
    
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.onclick = closeCancellationPopup;
    document.body.appendChild(overlay);
}

function reorderCancelledItems() {

    let items = [];

    if (window.activeOrder && window.activeOrder.items) {
        items = window.activeOrder.items;
    } else {
        const lastOrder = localStorage.getItem('lastOrderItems');
        if (lastOrder) {
            items = JSON.parse(lastOrder);
        }
    }

    if (items.length > 0) {
        localStorage.setItem('cart', JSON.stringify(items));
        
        window.location.href = 'cart.html';
    } else {
        alert('No items to reorder');
        window.location.href = 'veg.html';
    }
}

function closeCancellationPopup() {
    const popup = document.getElementById('cancellationPopup');
    const overlay = document.querySelector('.popup-overlay');

    if (popup) popup.remove();
    if (overlay) overlay.remove();
}

// ========== RATING FUNCTIONS ==========

window.rateOrder = function(rating) {
    const feedbackText = document.getElementById('feedbackText');
    if (feedbackText) {
        const messages = {
            1: "Very dissatisfied",
            2: "Dissatisfied", 
            3: "Neutral",
            4: "Satisfied",
            5: "Very satisfied"
        };
        feedbackText.value = `Rating: ${messages[rating]}\n\n`;
        feedbackText.focus();
    }
};

window.submitFeedback = async function(orderId) {
    const feedback = document.getElementById('feedbackText')?.value || '';
    
    try {
        await fetch(`${API_BASE}/api/orders/${orderId}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                feedback: feedback,
                timestamp: new Date().toISOString()
            })
        });
        
        alert('Thank you for your feedback!');
        closeFeedbackPopup();
        localStorage.removeItem('activeOrderId');
        
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback. Please try again.');
    }
};

window.contactSupport = function(orderId) {
    const phone = "919627024287"; 
    const message = `Help: Order #${orderId.slice(-6)} - Issue with my order`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    
    alert(`📞 Call us: +91 9627024287\n💬 WhatsApp: Same number\n📧 Email: Official.briobite@gmail.com`);
};

window.closeFeedbackPopup = function() {
    const popup = document.getElementById('deliveryFeedbackPopup');
    const overlay = document.querySelector('.popup-overlay');
    if (popup) popup.remove();
    if (overlay) overlay.remove();
    localStorage.removeItem('activeOrderId');
};

// Make functions globally available
window.reorderCancelledItems = reorderCancelledItems;
window.closeCancellationPopup = closeCancellationPopup;
