

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
        console.log('Cancelling order:', orderId); // Debug log
        
        const response = await fetch(`${API_BASE}/api/orders/cancel/${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
      
        console.log('Cancel response status:', response.status);
        
        const data = await response.json();
        console.log('Cancel response data:', data);
        
        if (response.ok) {
            alert('✅ Order cancelled successfully');
            
          
            const popup = document.getElementById('trackerPopup');
            const tracker = document.getElementById('floatingTracker');
            const orderDetails = document.getElementById('orderDetails');
            
            if (orderDetails) {
                orderDetails.innerHTML = '<p style="color: #dc3545; text-align: center;">Order has been cancelled</p>';
            }
            
          
            const progressFill = document.getElementById('progressFill');
            if (progressFill) progressFill.style.width = '0%';
           
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
            
         
            const timerElement = document.getElementById('cancellationTimer');
            if (timerElement) timerElement.style.display = 'none';
            
            
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
            
            
            if (cancelBtn) {
                cancelBtn.innerHTML = originalText;
                cancelBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('❌ Network error. Please check your connection and try again.');
        
  
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


function showDeliveryFeedback(order) {
   
    const existingPopup = document.getElementById('deliveryFeedbackPopup');
    if (existingPopup) existingPopup.remove();
    
   
    const feedbackPopup = document.createElement('div');
    feedbackPopup.id = 'deliveryFeedbackPopup';
    feedbackPopup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 10002;
        max-width: 350px;
        width: 90%;
        text-align: center;
        animation: slideIn 0.3s ease;
    `;
    
    feedbackPopup.innerHTML = `
        <div style="margin-bottom: 20px;">
            <i class="fas fa-check-circle" style="font-size: 60px; color: #28a745;"></i>
            <h3 style="margin: 15px 0 10px; color: #333;">Order Delivered!</h3>
            <p style="color: #666; margin-bottom: 20px;">Your order has been delivered. How was your experience?</p>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px;">
            <button onclick="rateOrder(1)" style="font-size: 24px; background: none; border: none; cursor: pointer;">😡</button>
            <button onclick="rateOrder(2)" style="font-size: 24px; background: none; border: none; cursor: pointer;">😕</button>
            <button onclick="rateOrder(3)" style="font-size: 24px; background: none; border: none; cursor: pointer;">😐</button>
            <button onclick="rateOrder(4)" style="font-size: 24px; background: none; border: none; cursor: pointer;">😊</button>
            <button onclick="rateOrder(5)" style="font-size: 24px; background: none; border: none; cursor: pointer;">🤩</button>
        </div>
        
        <textarea id="feedbackText" placeholder="Tell us about your experience..." 
            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px; min-height: 80px;"></textarea>
        
        <div style="display: flex; gap: 10px;">
            <button onclick="submitFeedback('${order._id}')" 
                style="flex: 2; background: #28a745; color: white; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                Submit Feedback
            </button>
            <button onclick="closeFeedbackPopup()" 
                style="flex: 1; background: #6c757d; color: white; padding: 12px; border: none; border-radius: 5px; cursor: pointer;">
                Later
            </button>
        </div>
        
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <p style="color: #666; margin-bottom: 10px;">Order not delivered yet?</p>
            <button onclick="contactSupport('${order._id}')" 
                style="background: #17a2b8; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                <i class="fas fa-headset"></i> Contact Support
            </button>
        </div>
        
        <button onclick="closeFeedbackPopup()" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
    `;
    
    document.body.appendChild(feedbackPopup);
    

    const overlay = document.createElement('div');
    overlay.id = 'feedbackOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(overlay);
}


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
        feedbackText.value = `Rating: ${messages[rating]}\n`;
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
        
      
        const tracker = document.getElementById('floatingTracker');
        if (tracker) {
            tracker.style.display = 'none';
        }
        localStorage.removeItem('activeOrderId');
        
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback. Please try again.');
    }
};

// Contact support
window.contactSupport = function(orderId) {
    const phone = "919627024287"; 
    const message = `Help: Order #${orderId.slice(-6)} - Not delivered yet`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    
   
    alert(`📞 Call us: +91 9627024287\n💬 WhatsApp: Same number\n📧 Email: Official.briobite@gmail.com`);
};

window.closeFeedbackPopup = function() {
    const popup = document.getElementById('deliveryFeedbackPopup');
    const overlay = document.getElementById('feedbackOverlay');
    if (popup) popup.remove();
    if (overlay) overlay.remove();
};


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
                    showDeliveryFeedback(data.order);
                }
                
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
                
            } else if (data.type === 'ORDER_DELIVERED' && data.orderId === orderId) {
             
                showDeliveryFeedback({ _id: orderId });
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