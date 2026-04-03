const API_BASE = "https://bbbackend-bng2.onrender.com";
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("bookingId");
let bookingStartDate = null;
if (!bookingId || bookingId === "null") {
  console.log("No bookingId found");
  document.getElementById("menuContainer").style.display = "block";
}

const container = document.getElementById("menuContainer");


const summarySection = document.getElementById("summarySection");
const menuSection = document.getElementById("menuSection");
const remakeBtn = document.getElementById("remakeBtn");
init();

/* ================== INIT ================== */

async function init() {
  console.log("🚀 Initializing page...");
  
 menuSection.style.display = "block";

// start date first
await loadBookingStartDate();

//generate days
generateDays();

  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log("Loading default menu...");
  await loadAdminDefaultMenu();
  
  console.log("Locking past days...");
  await lockPastDays();
  
  console.log("Loading summary...");
  await loadSummary();
  
  console.log("✅ Initialization complete");
}

/* ================== GENERATE DAYS ================== */

function formatDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function generateDays() {
  if (!bookingStartDate) {
  container.innerHTML = `
    <p style="text-align:center;color:red;font-weight:bold;">
      ⏳ Waiting for admin to activate your subscription
    </p>
  `;
  return;
}

  container.innerHTML = ""; 

  const baseDate = bookingStartDate;

  for (let day = 1; day <= 7; day++) {

    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + (day - 1));

    container.innerHTML += `
      <div class="day-card">
        <div class="day-header" onclick="toggleDay(${day})">
          ${formatDate(currentDate)} - Day ${day}
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

      <label>Select your meal</label>
      <select id="${meal}Items${day}">
        <option value="">Select your meal</option>
      </select>

      <label>Select time</label>
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
document.addEventListener("DOMContentLoaded", () => {

  const saveBtn = document.getElementById("saveMenuBtn");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", async () => {

    const days = [];
    let hasError = false;

    
    for (let day = 1; day <= 7; day++) {

      const breakfast = getMealData("breakfast", day);
      const lunch = getMealData("lunch", day);
      const dinner = getMealData("dinner", day);

      
      const breakfastEl = document.getElementById(`breakfastItems${day}`);
      const lunchEl = document.getElementById(`lunchItems${day}`);
      const dinnerEl = document.getElementById(`dinnerItems${day}`);

     
      [breakfastEl, lunchEl, dinnerEl].forEach(el => {
        if (el) el.classList.remove("error-field");
      });

     
      if (
        breakfast.items.length === 0 ||
        lunch.items.length === 0 ||
        dinner.items.length === 0
      ) {
        hasError = true;

        if (breakfast.items.length === 0 && breakfastEl) {
          breakfastEl.classList.add("error-field");
        }
        if (lunch.items.length === 0 && lunchEl) {
          lunchEl.classList.add("error-field");
        }
        if (dinner.items.length === 0 && dinnerEl) {
          dinnerEl.classList.add("error-field");
        }
      }

    
      days.push({
        dayNumber: day,
        breakfast,
        lunch,
        dinner
      });
    }

   
    if (hasError) {
      alert("⚠️ Please select all meals for all days");
      return;
    }


    try {

      const res = await fetch(`${API_BASE}/api/tiffin-menus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bookingId: bookingId,
          days: days
        })
      });

      const data = await res.json();
      console.log("Menu saved:", data);

      alert("✅ Menu Saved Successfully!");
      window.location.href = "index.html";

    } catch (err) {
      console.error("Save menu error:", err);
      alert("❌ Menu save failed");
    }

  });

});
/* ================== GET MEAL DATA ================== */

function getMealData(meal, day) {

  const select = document.getElementById(`${meal}Items${day}`);

 
  const items = select.value ? [select.value] : [];

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
today.setHours(0,0,0,0); 

const startDateOnly = new Date(startDate);
startDateOnly.setHours(0,0,0,0); 

const diff = Math.floor((today - startDateOnly) / (1000 * 60 * 60 * 24));

const lockUntil = diff + 2;

 for (let i = 1; i <= 7; i++) {

  const block = document.getElementById(`dayContent${i}`);
  if (!block) continue;

  if (i <= lockUntil) {
    block.querySelectorAll("select, input").forEach(el => {
      el.disabled = true;
    });

    block.style.opacity = "0.5";
  }
}
}

/* ==================LOAD ADMIN DEFAULT MENU================== */
async function loadAdminDefaultMenu() {
  try {

    const res = await fetch(`${API_BASE}/api/default-menu`);

    if (!res.ok) {
      console.log("Default menu not found");
      return;
    }

    const menu = await res.json();

    if (!menu || !menu.days) return;

    menu.days.forEach(d => {

      const day = d.dayNumber;

      setMealData("breakfast", day, d.breakfast);
      setMealData("lunch", day, d.lunch);
      setMealData("dinner", day, d.dinner);

    });

  } catch (err) {
    console.error("Menu load error:", err);
  }
}

function setMealData(meal, day, mealData) {
  if (!mealData) {
    console.log(`No ${meal} data for day ${day}`);
    return;
  }

  console.log(`Setting ${meal} for day ${day}:`, mealData);

  const select = document.getElementById(`${meal}Items${day}`);
  const timeSelect = document.getElementById(`${meal}Time${day}`);
  const customInput = document.getElementById(`custom${meal}${day}`);

  if (!select) {
    console.error(`❌ Select element ${meal}Items${day} not found!`);
    return;
  }
  
  if (!timeSelect) {
    console.error(`❌ Time select element ${meal}Time${day} not found!`);
    return;
  }

  console.log(`✅ Found elements for ${meal} day ${day}`);

 
select.innerHTML = `<option value="">Select your meal</option>`;
  timeSelect.innerHTML = "";


  if (Array.isArray(mealData.items) && mealData.items.length > 0) {
    console.log(`Adding ${mealData.items.length} items for ${meal} day ${day}`);
    mealData.items.forEach(item => {
      if (item && item.trim()) {
        const option = document.createElement("option");
        option.value = item.trim();
        option.textContent = item.trim();
        option.selected = false;
        select.appendChild(option);
      }
    });
  } else {
    console.log(`No items for ${meal} day ${day}`);
  }


  if (mealData.time && mealData.time.trim()) {
    console.log(`Setting time for ${meal} day ${day} to:`, mealData.time);
    
    const timeValues = mealData.time.split(",").map(t => t.trim());
    
    timeValues.forEach(t => {
      if (t) {
        const option = document.createElement("option");
        option.value = t;
        option.textContent = t;
        timeSelect.appendChild(option);
      }
    });
  } else {
    console.log(`No time for ${meal} day ${day}`);
  }

 
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Make Your Own";
  timeSelect.appendChild(customOption);


  if (timeSelect.options.length > 1) {
    timeSelect.value = timeSelect.options[0].value;
  }

  if (customInput) {
    customInput.style.display = "none";
    customInput.value = "";
  }
}

async function loadBookingStartDate() {
  try {
    const res = await fetch(`${API_BASE}/api/tiffin-bookings/${bookingId}`);
    if (!res.ok) return;

    const booking = await res.json();

 if (booking && booking.startDate) {
  bookingStartDate = new Date(booking.startDate);
  console.log("✅ Start Date Loaded:", bookingStartDate);
} else {
  console.log("❌ No startDate from backend");
}
  } catch (err) {
    console.error("Error fetching start date:", err);
  }
}



async function loadSummary() {
  try {

if (!bookingStartDate) {

  summarySection.style.display = "block";
  menuSection.style.display = "block";
  remakeBtn.style.display = "none";

  document.getElementById("summaryBox").innerHTML = `
    <p style="text-align:center;color:red;font-weight:bold;">
      ⏳ Waiting for admin to activate your subscription
    </p>
  `;

  return;
}

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

  const baseDate = bookingStartDate;
  const currentDate = new Date(baseDate);
  currentDate.setDate(baseDate.getDate() + (d.dayNumber - 1));

 
box.innerHTML += `
  <div style="background:#fff;padding:10px;margin-bottom:10px;border-radius:8px;">
    
    <b>
      ${formatDate(currentDate)} - Day ${d.dayNumber}
    </b><br>

    Breakfast: ${d.breakfast.items.join(", ")} (${d.breakfast.time})<br>
    Lunch: ${d.lunch.items.join(", ")} (${d.lunch.time})<br>
    Dinner: ${d.dinner.items.join(", ")} (${d.dinner.time})
  </div>
`;
});

    summarySection.style.display = "block";
    menuSection.style.display = "none";
    remakeBtn.style.display = "block";

  } catch (err) {
    summarySection.style.display = "none";
    menuSection.style.display = "block";
  }
}




if (remakeBtn) {
  remakeBtn.onclick = () => {

    
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