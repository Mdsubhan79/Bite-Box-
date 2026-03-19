const chatBox = document.getElementById("chatBox");

// 🔑 PUT YOUR FREE API KEY HERE
const HF_API_KEY = "YOUR_HUGGINGFACE_API_KEY";

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = type;
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🧠 AI UNDERSTANDING FUNCTION
async function understandUser(input) {
  const res = await fetch(
    "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: `Extract ingredients and diet type from this: ${input}`
      })
    }
  );

  const data = await res.json();
  return data[0]?.generated_text || input;
}

// 🍳 FETCH RECIPES
async function getRecipes(ingredients) {
  const res = await fetch(
    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredients}`
  );
  const data = await res.json();
  return data.meals || [];
}

// 🚀 MAIN FUNCTION
async function sendMessage() {
  const input = document.getElementById("userInput");
  const userText = input.value.trim();

  if (!userText) return;

  addMessage(userText, "user-msg");
  input.value = "";

  addMessage("Thinking... 🤖", "bot-msg");

  try {
    // 🧠 Step 1: Understand user
    const aiResponse = await understandUser(userText);

    // Extract ingredients (basic fallback)
    const ingredients = userText;

    // 🍳 Step 2: Get recipes
    const meals = await getRecipes(ingredients);

    if (!meals.length) {
      addMessage("❌ No recipes found", "bot-msg");
      return;
    }

    showRecipes(meals.slice(0, 5), userText);

  } catch (err) {
    addMessage("⚠️ AI Error", "bot-msg");
  }
}

// 🎯 SHOW RECIPES + ORDER BUTTON
function showRecipes(meals, userText) {
  meals.forEach(meal => {
    const div = document.createElement("div");
    div.className = "recipe-card";

    const isHighProtein =
      userText.toLowerCase().includes("protein");

    div.innerHTML = `
      <h4>${meal.strMeal}</h4>
      <img src="${meal.strMealThumb}">
      
      ${isHighProtein ? "<p>💪 High Protein Suggestion</p>" : ""}

      <button onclick="orderMeal('${meal.strMeal}')">
        🛒 Order This Meal
      </button>

      <p>
        <a href="https://www.youtube.com/results?search_query=${meal.strMeal}" target="_blank">
          ▶ Watch Recipe
        </a>
      </p>
    `;

    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🛒 CONNECT TO YOUR SYSTEM
function orderMeal(mealName) {
  localStorage.setItem("selectedMeal", mealName);

  // Redirect to your service page
  window.location.href = "services.html";
}