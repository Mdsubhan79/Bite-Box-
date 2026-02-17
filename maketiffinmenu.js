const API_BASE = "https://bbbackend-bng2.onrender.com";
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("bookingId");

const container = document.getElementById("menuContainer");

init();

/* ================== INIT ================== */

async function init() {
  generateDays();
  await loadAdminDefaultMenu();   // ✅ FIXED
  await lockPastDays();
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

  if (!booking || !booking.startDate) return;

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

/* ================== LOAD ADMIN DEFAULT MENU (FIXED) ================== */

async function loadAdminDefaultMenu() {

  try {

    const res = await fetch(`${API_BASE}/api/default-menu`);
    const menu = await res.json();

    if (!menu || !menu.days) return;

    menu.days.forEach(d => {

      const day = d.dayNumber;

      setMealData("breakfast", day, d.breakfast);
      setMealData("lunch", day, d.lunch);
      setMealData("dinner", day, d.dinner);

    });

  } catch (err) {
    console.log("No default menu found");
  }
}

/* ================== FIXED MULTI-SELECT LOADER ================== */

function setMealData(meal, day, mealData) {

  if (!mealData) return;

  const select = document.getElementById(`${meal}Items${day}`);
  const timeSelect = document.getElementById(`${meal}Time${day}`);

  if (!select || !timeSelect) return;

  // Clear old selection
  Array.from(select.options).forEach(option => {
    option.selected = false;
  });

  // Select correct items
  mealData.items.forEach(item => {
    Array.from(select.options).forEach(option => {
      if (option.value.trim() === item.trim()) {
        option.selected = true;
      }
    });
  });

  // Set time
  timeSelect.value = mealData.time;

  // If custom time
  if (!Array.from(timeSelect.options).some(o => o.value === mealData.time)) {
    timeSelect.value = "custom";
    document.getElementById(`custom${meal}${day}`).style.display = "block";
    document.getElementById(`custom${meal}${day}`).value = mealData.time;
  }
}