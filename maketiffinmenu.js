const API_BASE = "https://bbbackend-bng2.onrender.com";
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("bookingId");
if (!bookingId || bookingId === "null") {
  console.log("No bookingId found");
  document.getElementById("menuContainer").style.display = "block";
}

const container = document.getElementById("menuContainer");
const showSummaryBtn = document.getElementById("showSummaryBtn");
const showSetMenuBtn = document.getElementById("showSetMenuBtn");

const summarySection = document.getElementById("summarySection");
const menuSection = document.getElementById("menuSection");
const remakeBtn = document.getElementById("remakeBtn");
init();

/* ================== INIT ================== */

async function init() {
 
  generateDays();
  await loadAdminDefaultMenu();  
  await lockPastDays();
  await loadSummary();
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
      </select>

      <select id="${meal}Time${day}">
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
  window.location.href = `maketiffinmenu.html?bookingId=${bookingId}`;
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

if (!res.ok) {
  console.log("Booking fetch failed");
  return;
}

const booking = await res.json();

  if (!booking || !booking.startDate) return;

  const startDate = new Date(booking.startDate);
  const today = new Date();

  const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

  const lockUntil = diff + 2; 

  for (let i = 1; i <= lockUntil; i++) {

    const block = document.getElementById(`dayContent${i}`);
    if (!block) continue;

    block.querySelectorAll("select, input").forEach(el => {
      el.disabled = true;
    });

  
    block.style.opacity = "0.5";
  }
}

/* ==================LOAD ADMIN DEFAULT MENU================== */

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


function setMealData(meal, day, mealData) {

  if (!mealData) return;

  const select = document.getElementById(`${meal}Items${day}`);
  const timeSelect = document.getElementById(`${meal}Time${day}`);
  const customInput = document.getElementById(`custom${meal}${day}`);

  if (!select || !timeSelect) return;

  /* ================= ITEMS ================= */
  select.innerHTML = "";


  mealData.items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.trim();
    option.textContent = item.trim();
    option.selected =false;   
    select.appendChild(option);
  });


if (!mealData.time) return;


timeSelect.innerHTML = "";


const timeValues = mealData.time.split(",").map(t => t.trim());


timeValues.forEach(t => {
  const option = document.createElement("option");
  option.value = t;
  option.textContent = t;
  timeSelect.appendChild(option);
});

const customOption = document.createElement("option");
customOption.value = "custom";
customOption.textContent = "Make Your Own";
timeSelect.appendChild(customOption);

timeSelect.value = timeValues[0];


customInput.style.display = "none";
customInput.value = "";
}
async function loadSummary() {
  try {

    const res = await fetch(`${API_BASE}/api/tiffin-menus/${bookingId}`);

    if (!res.ok) {
      
      summarySection.style.display = "none";
      menuSection.style.display = "block";
      return;
    }

    const data = await res.json();

    if (!data || !data.days) {
      summarySection.style.display = "none";
      menuSection.style.display = "block";
      return;
    }

    const box = document.getElementById("summaryBox");
    box.innerHTML = "<h2>Your Weekly Menu</h2>";

    data.days.forEach(d => {
      box.innerHTML += `
        <div style="background:#fff;padding:10px;margin-bottom:10px;border-radius:8px;">
          <b>Day ${d.dayNumber}</b><br>
          Breakfast: ${d.breakfast.items.join(", ")} (${d.breakfast.time})<br>
          Lunch: ${d.lunch.items.join(", ")} (${d.lunch.time})<br>
          Dinner: ${d.dinner.items.join(", ")} (${d.dinner.time})
        </div>
      `;
    });

    document.getElementById("remakeBtn").style.display = "block";


    summarySection.style.display = "block";
    menuSection.style.display = "none";

  } catch (err) {
    console.log("Summary error:", err);

    summarySection.style.display = "none";
    menuSection.style.display = "block";
  }
}





showSetMenuBtn.onclick = () => {
  summarySection.style.display = "none";
  menuSection.style.display = "block";


  for (let day = 1; day <= 7; day++) {
    ["breakfast", "lunch", "dinner"].forEach(meal => {
      const select = document.getElementById(`${meal}Items${day}`);
      if (select) {
        Array.from(select.options).forEach(option => {
          option.selected = false;
        });
      }
    });
  }
};



if (remakeBtn) {
  remakeBtn.onclick = () => {

    // Show menu form
    summarySection.style.display = "none";
    menuSection.style.display = "block";
    remakeBtn.style.display = "none";

   
    for (let day = 1; day <= 7; day++) {

      ["breakfast", "lunch", "dinner"].forEach(meal => {

        const select = document.getElementById(`${meal}Items${day}`);
        const timeSelect = document.getElementById(`${meal}Time${day}`);
        const customInput = document.getElementById(`custom${meal}${day}`);

        if (select) {
          Array.from(select.options).forEach(option => {
            option.selected = false;
          });
        }

        if (timeSelect) {
          timeSelect.selectedIndex = 0;
        }

        if (customInput) {
          customInput.value = "";
          customInput.style.display = "none";
        }

      });
    }

  };
}