// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(item) {
  const existingItem = cart.find(cartItem => cartItem.name === item.name);

  const baseImagePath = ''; 

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...item,
      image: item.image.startsWith('http') ? item.image : baseImagePath + item.image,
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}


function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = count;
  }
}

function loadVegItems() {
  const vegMenu = [
    {
      name: "Paneer Butter Masala",
      desc: "Rich and creamy curry with paneer cubes.",
      price: 180,
      image: "thali5.jpg"
    },
    {
      name: "Chole Bhature",
      desc: "Spicy chickpeas served with fluffy fried bread.",
      price: 120,
      image: "thali6.jpg"
    },
    {
      name: "Veg Biryani",
      desc: "Aromatic rice with mixed vegetables and spices.",
      price: 150,
      image: "thali1.jpg"
    },
    {
      name: "Masala Dosa",
      desc: "Crispy rice crepe stuffed with spiced potatoes.",
      price: 90,
      image: "thali2.jpg"
    },
    {
      name: "Aloo Paratha",
      desc: "Stuffed flatbread served with curd and pickle.",
      price: 70,
      image: "thali3.jpg"
    }
  ];


  const container = document.getElementById("vegFoodItems");
  vegMenu.forEach(item => {
    const card = document.createElement("div");
    card.className = "food-card";
    card.innerHTML = `
      <img src="${item.image || 'images/default-food.jpg'}" alt="${item.name}" class="food-img">
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <p class="price">₹${item.price}</p>
      <button class="order-btn" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})" data-translate="orderNowBtn">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}

function loadNonVegItems() {
  const nonVegMenu = [
    {
      name: "Chicken Biryani",
      desc: "Aromatic rice with tender chicken and spices.",
      price: 200,
      image: "thali1.jpg"
    },
    {
      name: "Butter Chicken",
      desc: "Creamy tomato-based curry with marinated chicken.",
      price: 220,
      image: "thali2.jpg"
    },
    {
      name: "Egg Curry",
      desc: "Boiled eggs simmered in spicy gravy.",
      price: 130,
      image: "thali3.jpg"
    },
    {
      name: "Chicken Lollipop",
      desc: "Crispy fried chicken wings with spicy coating.",
      price: 160,
      image: "thali4.jpg"
    },
    {
      name: "Fish Fry",
      desc: "Marinated fish fillets fried to golden perfection.",
      price: 180,
      image: "thali5.jpg"
    }
  ];

  const container = document.getElementById("nonVegFoodItems");
  nonVegMenu.forEach(item => {
    const card = document.createElement("div");
    card.className = "food-card";
    card.innerHTML = `
      <img src="${item.image || 'images/default-food.jpg'}" alt="${item.name}" class="food-img">
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <p class="price">₹${item.price}</p>
      <button class="order-btn" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})" data-translate="orderNowBtn">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}

function checkout() {
  window.location.href = "cartpage.html";
}


document.addEventListener("DOMContentLoaded", function () {
  if (document.body.getAttribute('data-page') === 'veg') {
    loadVegItems();
  } else if (document.body.getAttribute('data-page') === 'non-veg') {
    loadNonVegItems();
    loadVegItems(); 
  }
  updateCartCount();
});






