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