const API_BASE = "https://bbbackend-bng2.onrender.com";
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("bookingId");

const container = document.getElementById("menuContainer");

document.getElementById("weeklyBtn").onclick = () => {

  container.innerHTML = "";

  for (let day = 1; day <= 7; day++) {

    container.innerHTML += `
      <div class="day-card" id="day${day}">
        <h2>Day ${day}</h2>

        ${createMealSection("Breakfast", day)}
        ${createMealSection("Lunch", day)}
        ${createMealSection("Dinner", day)}
      </div>
    `;
  }

  lockPastDays();
};

function createMealSection(meal, day) {

  return `
    <h4>${meal}</h4>

    <select multiple id="${meal.toLowerCase()}Items${day}">
      <option>Item 1</option>
      <option>Item 2</option>
      <option>Item 3</option>
      <option>Item 4</option>
    </select>

    <select id="${meal.toLowerCase()}Time${day}">
      <option>7:00AM-7:30AM</option>
      <option>7:30AM-8:00AM</option>
      <option>8:00AM-8:30AM</option>
      <option value="custom">Make Your Own</option>
    </select>

    <input type="text" id="custom${meal}${day}" placeholder="Custom time">
  `;
}

document.getElementById("saveBtn").onclick = async () => {

  const days = [];

  for (let day = 1; day <= 7; day++) {

    days.push({
      dayNumber: day,
      breakfast: getMealData("breakfast", day),
      lunch: getMealData("lunch", day),
      dinner: getMealData("dinner", day)
    });
  }

  await fetch(`${API_BASE}/api/tiffin-menus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, days })
  });

  window.location.href = "index.html";
};

function getMealData(meal, day) {

  const items = [...document.getElementById(`${meal}Items${day}`).selectedOptions].map(o => o.value);

  const timeSelect = document.getElementById(`${meal}Time${day}`).value;

  const time = timeSelect === "custom"
    ? document.getElementById(`custom${meal.charAt(0).toUpperCase() + meal.slice(1)}${day}`).value
    : timeSelect;

  return { items, time };
}

async function lockPastDays() {

  const res = await fetch(`${API_BASE}/api/tiffin-bookings/${bookingId}`);
  const booking = await res.json();

  const startDate = new Date(booking.startDate);
  const today = new Date();

  const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

  for (let i = 1; i <= diff + 1; i++) {

    const block = document.getElementById(`day${i}`);
    if (!block) continue;

    block.querySelectorAll("select, input").forEach(el => {
      el.disabled = true;
    });
  }
}