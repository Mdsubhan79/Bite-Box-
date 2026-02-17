const API_BASE = "https://bbbackend-bng2.onrender.com";
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("bookingId");

const container = document.getElementById("menuContainer");

init();

function init() {
  generateDays();
  lockPastDays();
}

/* ================== GENERATE DAYS ================== */

function generateDays() {

  for (let day = 1; day <= 7; day++) {

    container.innerHTML += `
      <div class="day-card">
        <div class="day-header" onclick="toggleDay(${day})">
          Day ${day}
        </div>

        <div class="day-content" id="dayContent${day}">
          ${createMealSection("breakfast", day)}
          ${createMealSection("lunch", day)}
          ${createMealSection("dinner", day)}
        </div>
      </div>
    `;
  }
}

/* ================== TOGGLE ACCORDION ================== */

function toggleDay(day) {

  for (let i = 1; i <= 7; i++) {
    const content = document.getElementById(`dayContent${i}`);
    if (i === day) {
      content.classList.toggle("active");
    } else {
      content.classList.remove("active");
    }
  }
}

/* ================== CREATE MEAL ================== */

function createMealSection(meal, day) {

  return `
    <div class="meal-section">
      <h4>${meal.toUpperCase()}</h4>

      <select multiple id="${meal}Items${day}">
        <option>Paneer</option>
        <option>Rice</option>
        <option>Dal</option>
        <option>Roti</option>
      </select>

      <select id="${meal}Time${day}">
        <option>7:00AM-7:30AM</option>
        <option>7:30AM-8:00AM</option>
        <option>8:00AM-8:30AM</option>
        <option value="custom">Make Your Own</option>
      </select>

      <input type="text"
             id="custom${meal}${day}"
             placeholder="Enter custom time"
             style="display:none;" />

    </div>
  `;
}

/* ================== SHOW CUSTOM TIME ================== */

document.addEventListener("change", function(e){

  if (e.target.value === "custom") {
    const id = e.target.id.replace("Time", "");
    document.getElementById("custom" + id).style.display = "block";
  }

});

/* ================== SAVE MENU ================== */

document.getElementById("saveMenuBtn").onclick = async () => {

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

  alert("Menu Saved Successfully!");
  window.location.href = "index.html";
};

/* ================== GET MEAL DATA ================== */

function getMealData(meal, day) {

  const items = [...document.getElementById(`${meal}Items${day}`).selectedOptions]
    .map(o => o.value);

  const timeSelect = document.getElementById(`${meal}Time${day}`).value;

  const time = timeSelect === "custom"
    ? document.getElementById(`custom${meal}${day}`).value
    : timeSelect;

  return { items, time };
}

/* ================== LOCK PAST DAYS ================== */

async function lockPastDays() {

  const res = await fetch(`${API_BASE}/api/tiffin-bookings/${bookingId}`);
  const booking = await res.json();

  const startDate = new Date(booking.startDate);
  const today = new Date();

  const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

  for (let i = 1; i <= diff; i++) {

    const block = document.getElementById(`dayContent${i}`);
    if (!block) continue;

    block.querySelectorAll("select, input").forEach(el => {
      el.disabled = true;
    });
  }
}


async function loadDefaultMenu() {

  const res = await fetch(`${API_BASE}/api/admin/default-menu`);
  const menu = await res.json();

  if (!menu) return;

  menu.days.forEach(d => {

    document.getElementById(`breakfastItems${d.dayNumber}`).value =
      d.breakfast.items.join(",");

    document.getElementById(`breakfastTime${d.dayNumber}`).value =
      d.breakfast.time;

    document.getElementById(`lunchItems${d.dayNumber}`).value =
      d.lunch.items.join(",");

    document.getElementById(`lunchTime${d.dayNumber}`).value =
      d.lunch.time;

    document.getElementById(`dinnerItems${d.dayNumber}`).value =
      d.dinner.items.join(",");

    document.getElementById(`dinnerTime${d.dayNumber}`).value =
      d.dinner.time;
  });
}

window.onload = function() {
  loadDefaultMenu();
};