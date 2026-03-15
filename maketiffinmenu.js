const API_BASE = "https://bbbackend-bng2.onrender.com";
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("bookingId");

// Store default menu globally
let defaultMenuData = null;

const container = document.getElementById("menuContainer");
const summarySection = document.getElementById("summarySection");
const menuSection = document.getElementById("menuSection");
const remakeBtn = document.getElementById("remakeBtn");

// Initialize
init();

/* ================== INIT ================== */
async function init() {
    menuSection.style.display = "block";
    
    // First generate the day structure
    generateDays();
    
    // Then load and populate default menu
    await loadAdminDefaultMenu();
    
    // Then populate time dropdowns with default options
    populateTimeDropdowns();
    
    // Apply default menu selections after dropdowns are populated
    applyDefaultMenuSelections();
    
    // Lock past days if needed
    await lockPastDays();
    
    // Load summary
    await loadSummary();
}

/* ================== GENERATE DAYS ================== */
function generateDays() {
    container.innerHTML = ''; // Clear container first
    
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

/* ================== CREATE MEAL SECTION ================== */
function createMealSection(meal, day) {
    return `
        <div class="meal-section">
            <h4>${meal.toUpperCase()}</h4>
            <select multiple id="${meal}Items${day}" class="item-select" style="min-height: 100px;">
                <!-- Items will be populated by JavaScript -->
            </select>
            <select id="${meal}Time${day}" class="time-select">
                <!-- Time options will be populated by JavaScript -->
            </select>
            <input type="text"
                   id="custom${meal}${day}"
                   class="custom-time"
                   placeholder="Enter custom time (e.g., 8:00 AM)"
                   style="display:none;" />
        </div>
    `;
}

/* ================== POPULATE TIME DROPDOWNS ================== */
function populateTimeDropdowns() {
    const timeSlots = [
        "7:00 AM - 8:00 AM",
        "8:00 AM - 9:00 AM",
        "9:00 AM - 10:00 AM",
        "12:00 PM - 1:00 PM",
        "1:00 PM - 2:00 PM",
        "2:00 PM - 3:00 PM",
        "7:00 PM - 8:00 PM",
        "8:00 PM - 9:00 PM",
        "9:00 PM - 10:00 PM"
    ];
    
    for (let day = 1; day <= 7; day++) {
        ["breakfast", "lunch", "dinner"].forEach(meal => {
            const timeSelect = document.getElementById(`${meal}Time${day}`);
            if (timeSelect) {
                timeSelect.innerHTML = ''; // Clear existing
                
                // Add default time options
                timeSlots.forEach(slot => {
                    const option = document.createElement('option');
                    option.value = slot;
                    option.textContent = slot;
                    timeSelect.appendChild(option);
                });
                
                // Add custom option
                const customOption = document.createElement('option');
                customOption.value = "custom";
                customOption.textContent = "Custom Time";
                timeSelect.appendChild(customOption);
            }
        });
    }
}

/* ================== TOGGLE ACCORDION ================== */
window.toggleDay = function(day) {
    for (let i = 1; i <= 7; i++) {
        const content = document.getElementById(`dayContent${i}`);
        if (content) {
            if (i === day) {
                content.classList.toggle("active");
            } else {
                content.classList.remove("active");
            }
        }
    }
};

/* ================== SHOW CUSTOM TIME ================== */
document.addEventListener("change", function(e) {
    if (e.target.classList.contains('time-select') && e.target.value === "custom") {
        const id = e.target.id;
        const meal = id.replace('Time', '');
        const customInput = document.getElementById(`custom${meal}`);
        if (customInput) {
            customInput.style.display = "block";
        }
    } else if (e.target.classList.contains('time-select')) {
        const id = e.target.id;
        const meal = id.replace('Time', '');
        const customInput = document.getElementById(`custom${meal}`);
        if (customInput) {
            customInput.style.display = "none";
        }
    }
});

/* ================== LOAD ADMIN DEFAULT MENU ================== */
async function loadAdminDefaultMenu() {
    try {
        const res = await fetch(`${API_BASE}/api/default-menu`);
        if (!res.ok) {
            console.log("No default menu found, using empty menu");
            return;
        }
        
        defaultMenuData = await res.json();
        console.log("Default menu loaded:", defaultMenuData);
        
    } catch (err) {
        console.log("Error loading default menu:", err);
    }
}

/* ================== APPLY DEFAULT MENU SELECTIONS ================== */
function applyDefaultMenuSelections() {
    if (!defaultMenuData || !defaultMenuData.days) return;
    
    defaultMenuData.days.forEach(dayData => {
        const day = dayData.dayNumber;
        
        // Apply breakfast items
        if (dayData.breakfast && dayData.breakfast.items) {
            const breakfastSelect = document.getElementById(`breakfastItems${day}`);
            if (breakfastSelect) {
                // Clear existing options first
                breakfastSelect.innerHTML = '';
                
                // Add items as options
                dayData.breakfast.items.forEach(item => {
                    if (item && item.trim()) {
                        const option = document.createElement('option');
                        option.value = item.trim();
                        option.textContent = item.trim();
                        option.selected = true;
                        breakfastSelect.appendChild(option);
                    }
                });
            }
            
            // Set breakfast time
            if (dayData.breakfast.time) {
                const breakfastTime = document.getElementById(`breakfastTime${day}`);
                if (breakfastTime) {
                    // Check if the time exists in dropdown, if not add it
                    let optionExists = false;
                    Array.from(breakfastTime.options).forEach(opt => {
                        if (opt.value === dayData.breakfast.time) {
                            optionExists = true;
                        }
                    });
                    
                    if (!optionExists) {
                        const option = document.createElement('option');
                        option.value = dayData.breakfast.time;
                        option.textContent = dayData.breakfast.time;
                        breakfastTime.appendChild(option);
                    }
                    
                    breakfastTime.value = dayData.breakfast.time;
                }
            }
        }
        
        // Apply lunch items
        if (dayData.lunch && dayData.lunch.items) {
            const lunchSelect = document.getElementById(`lunchItems${day}`);
            if (lunchSelect) {
                lunchSelect.innerHTML = '';
                dayData.lunch.items.forEach(item => {
                    if (item && item.trim()) {
                        const option = document.createElement('option');
                        option.value = item.trim();
                        option.textContent = item.trim();
                        option.selected = true;
                        lunchSelect.appendChild(option);
                    }
                });
            }
            
            // Set lunch time
            if (dayData.lunch.time) {
                const lunchTime = document.getElementById(`lunchTime${day}`);
                if (lunchTime) {
                    let optionExists = false;
                    Array.from(lunchTime.options).forEach(opt => {
                        if (opt.value === dayData.lunch.time) {
                            optionExists = true;
                        }
                    });
                    
                    if (!optionExists) {
                        const option = document.createElement('option');
                        option.value = dayData.lunch.time;
                        option.textContent = dayData.lunch.time;
                        lunchTime.appendChild(option);
                    }
                    
                    lunchTime.value = dayData.lunch.time;
                }
            }
        }
        
        // Apply dinner items
        if (dayData.dinner && dayData.dinner.items) {
            const dinnerSelect = document.getElementById(`dinnerItems${day}`);
            if (dinnerSelect) {
                dinnerSelect.innerHTML = '';
                dayData.dinner.items.forEach(item => {
                    if (item && item.trim()) {
                        const option = document.createElement('option');
                        option.value = item.trim();
                        option.textContent = item.trim();
                        option.selected = true;
                        dinnerSelect.appendChild(option);
                    }
                });
            }
            
            // Set dinner time
            if (dayData.dinner.time) {
                const dinnerTime = document.getElementById(`dinnerTime${day}`);
                if (dinnerTime) {
                    let optionExists = false;
                    Array.from(dinnerTime.options).forEach(opt => {
                        if (opt.value === dayData.dinner.time) {
                            optionExists = true;
                        }
                    });
                    
                    if (!optionExists) {
                        const option = document.createElement('option');
                        option.value = dayData.dinner.time;
                        option.textContent = dayData.dinner.time;
                        dinnerTime.appendChild(option);
                    }
                    
                    dinnerTime.value = dayData.dinner.time;
                }
            }
        }
    });
}

/* ================== SAVE MENU ================== */
document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("saveMenuBtn");
    
    if (!saveBtn) return;
    
    saveBtn.addEventListener("click", async () => {
        const days = [];
        
        for (let day = 1; day <= 7; day++) {
            days.push({
                dayNumber: day,
                breakfast: getMealData("breakfast", day),
                lunch: getMealData("lunch", day),
                dinner: getMealData("dinner", day)
            });
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
            
            alert("Menu Saved Successfully!");
            window.location.href = "index.html";
            
        } catch (err) {
            console.error("Save menu error:", err);
            alert("Menu save failed");
        }
    });
});

/* ================== GET MEAL DATA ================== */
function getMealData(meal, day) {
    const itemsSelect = document.getElementById(`${meal}Items${day}`);
    const items = itemsSelect ? Array.from(itemsSelect.selectedOptions).map(o => o.value) : [];
    
    const timeSelect = document.getElementById(`${meal}Time${day}`);
    let time = timeSelect ? timeSelect.value : '';
    
    if (time === "custom") {
        const customInput = document.getElementById(`custom${meal}${day}`);
        time = customInput ? customInput.value : '';
    }
    
    return { items, time };
}

/* ================== LOCK PAST DAYS ================== */
async function lockPastDays() {
    if (!bookingId || bookingId === "null") return;
    
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

/* ================== LOAD SUMMARY ================== */
async function loadSummary() {
    if (!bookingId || bookingId === "null") {
        summarySection.style.display = "none";
        menuSection.style.display = "block";
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/tiffin-menus/${bookingId}`);
        
        if (!res.ok) {
            summarySection.style.display = "none";
            menuSection.style.display = "block";
            return;
        }
        
        const data = await res.json();
        
        if (!data || !data.days || data.days.length === 0) {
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
        
        summarySection.style.display = "block";
        menuSection.style.display = "none";
        remakeBtn.style.display = "block";
        
    } catch (err) {
        console.error("Error loading summary:", err);
        summarySection.style.display = "none";
        menuSection.style.display = "block";
    }
}

/* ================== REMAKE BUTTON ================== */
if (remakeBtn) {
    remakeBtn.onclick = () => {
        summarySection.style.display = "none";
        menuSection.style.display = "block";
        remakeBtn.style.display = "none";
        
        // Reset all selections
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
        
       
        applyDefaultMenuSelections();
    };
}