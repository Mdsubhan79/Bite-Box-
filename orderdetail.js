
const cart = JSON.parse(localStorage.getItem('cart')) || [];
const userId = 'user_' + Date.now();

function displayOrderItems() {
    const container = document.getElementById('orderItems');
    let total = 0;
    
    container.innerHTML = '';
    cart.forEach((item, index) => {
        const itemTotal = item.price * (item.quantity || 1);
        total += itemTotal;
        
        container.innerHTML += `
            <div class="order-item">
                <div>
                    <strong>${item.name}</strong> x ${item.quantity || 1}
                    <br>
                    <small>₹${item.price} each</small>
                </div>
                <div>
                    ₹${itemTotal}
                    <button class="customize-btn" onclick="customizeItem(${index})">Customize</button>
                </div>
            </div>
        `;
    });
    
    document.getElementById('totalPrice').innerHTML = `Total: ₹${total}`;
    localStorage.setItem('orderTotal', total);
}

// Customize item function
window.customizeItem = (index) => {
    const item = cart[index];
   
    if (item.category === 'veg') {
        window.location.href = `veg.html?customize=${index}`;
    } else if (item.category === 'non-veg') {
        window.location.href = `non-veg.html?customize=${index}`;
    } else if (item.category === 'tiffin') {
        window.location.href = `tiffin.html?customize=${index}`;
    }
};

// Handle form submission
document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const orderData = {
        userId,
        items: cart,
        customerDetails: {
            name: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            landmark: document.getElementById('landmark').value
        },
        totalAmount: parseFloat(localStorage.getItem('orderTotal')),
        orderTime: new Date()
    };
    
    try {
        const response = await fetch('https://bbbackend-bng2.onrender.com/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const order = await response.json();
        
      
        localStorage.setItem('activeOrderId', order._id);
        localStorage.setItem('orderTime', new Date().toISOString());
        
      
        localStorage.removeItem('cart');
        
     
        alert('Order placed successfully! Track your order using the floating tracker.');
        
    
        initializeWebSocket(order._id);
        
      
        document.querySelector('.moveable-object').style.display = 'flex';
        
    } catch (error) {
        alert('Error placing order. Please try again.');
    }
});


function initializeWebSocket(orderId) {
    const ws = new WebSocket('wss://https://bbbackend-bng2.onrender.com');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ORDER_UPDATED' && data.order._id === orderId) {
            updateOrderPopup(data.order);
        } else if (data.type === 'ORDER_DELETED' && data.orderId === orderId) {
            handleOrderDeletion(data.reason);
        }
    };
}


function updateOrderPopup(order) {
    const popupContent = document.getElementById('popupContent');
    const progressFill = document.getElementById('progressFill');
    const progressSteps = document.getElementById('progressSteps');
    
  
    const progressMap = {
        'pending': 20,
        'confirmed': 40,
        'preparing': 60,
        'out-for-delivery': 80,
        'delivered': 100
    };
    
    progressFill.style.width = `${progressMap[order.orderStatus] || 0}%`;
    
 
    const steps = ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
    let stepsHtml = '';
    steps.forEach((step, index) => {
        const statusMap = ['orderPlaced', 'confirmed', 'preparing', 'outForDelivery', 'delivered'];
        const isActive = order.progressSteps[statusMap[index]]?.status;
        stepsHtml += `<div class="step ${isActive ? 'active' : ''}">${step}</div>`;
    });
    progressSteps.innerHTML = stepsHtml;
    
   
    document.getElementById('orderDetails').innerHTML = `
        <p><strong>Items:</strong> ${order.items.length} item(s)</p>
        <p><strong>Total:</strong> ₹${order.totalAmount}</p>
        <p><strong>Status:</strong> ${order.orderStatus}</p>
        <p><strong>Payment:</strong> ${order.paymentStatus}</p>
        <p><strong>Delivery:</strong> ${order.deliveryEstimate}</p>
    `;
    
   
    const cancelBtn = document.getElementById('cancelOrderBtn');
    if (new Date() < new Date(order.cancellationDeadline)) {
        cancelBtn.disabled = false;
    } else {
        cancelBtn.disabled = true;
    }
    

    if (order.orderStatus === 'delivered') {
        setTimeout(() => {
            document.querySelector('.moveable-object').style.display = 'none';
        }, 5000);
    }
}


function handleOrderDeletion(reason) {
    document.getElementById('adminMessage').innerHTML = `❌ ${reason || 'Order cancelled by admin'}`;
    document.getElementById('cancelOrderBtn').style.display = 'none';
    document.getElementById('reorderBtn').style.display = 'block';
    
    document.getElementById('reorderBtn').onclick = () => {
       
        const orderItems = JSON.parse(localStorage.getItem('lastOrderItems')) || [];
        localStorage.setItem('cart', JSON.stringify(orderItems));
        window.location.href = 'orderdetail.html';
    };
}

// Make the object moveable
const moveableObj = document.getElementById('moveableObj');
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

moveableObj.addEventListener('mousedown', dragStart);
moveableObj.addEventListener('mouseup', dragEnd);
moveableObj.addEventListener('mousemove', drag);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    if (e.target === moveableObj) {
        isDragging = true;
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        setTranslate(currentX, currentY, moveableObj);
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}


moveableObj.addEventListener('click', () => {
    document.getElementById('orderPopup').classList.add('active');
    loadActiveOrder();
});

// Close popup
document.getElementById('closePopup').addEventListener('click', () => {
    document.getElementById('orderPopup').classList.remove('active');
});

// Load active order details
async function loadActiveOrder() {
    const orderId = localStorage.getItem('activeOrderId');
    if (!orderId) return;
    
    try {
        const response = await fetch(`https://bbbackend-bng2.onrender.com/api/orders/active/${userId}`);
        const order = await response.json();
        
        if (order) {
            updateOrderPopup(order);
        }
    } catch (error) {
        console.error('Error loading order:', error);
    }
}

// Cancel order 
document.getElementById('cancelOrderBtn').addEventListener('click', async () => {
    const orderId = localStorage.getItem('activeOrderId');
    
    if (confirm('Are you sure you want to cancel this order?')) {
        try {
            const response = await fetch(`https://bbbackend-bng2.onrender.com/api/orders/cancel/${orderId}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                alert('Order cancelled successfully');
                document.getElementById('orderPopup').classList.remove('active');
                setTimeout(() => {
                    document.querySelector('.moveable-object').style.display = 'none';
                }, 2000);
            } else {
                const data = await response.json();
                alert(data.error || 'Cannot cancel order. Time limit expired.');
            }
        } catch (error) {
            alert('Error cancelling order');
        }
    }
});


displayOrderItems();

if (localStorage.getItem('activeOrderId')) {
    document.querySelector('.moveable-object').style.display = 'flex';
    initializeWebSocket(localStorage.getItem('activeOrderId'));
}