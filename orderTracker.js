function createFloatingTracker(){

const tracker = document.createElement("div")

tracker.id="orderTracker"

tracker.innerHTML="🛵"

tracker.style.position="fixed"
tracker.style.bottom="20px"
tracker.style.right="20px"
tracker.style.width="60px"
tracker.style.height="60px"
tracker.style.borderRadius="50%"
tracker.style.background="orange"
tracker.style.display="flex"
tracker.style.alignItems="center"
tracker.style.justifyContent="center"
tracker.style.cursor="pointer"

document.body.appendChild(tracker)

tracker.onclick=openOrderPopup

}


function openOrderPopup(){

const popup=document.createElement("div")

popup.innerHTML=`

<div class="popup">

<h3>Your Order</h3>

<div id="orderItems"></div>

<div id="orderStatus"></div>

<button onclick="cancelOrder()">Cancel</button>

<button onclick="this.parentElement.remove()">X</button>

</div>

`

document.body.appendChild(popup)

loadOrder()

}