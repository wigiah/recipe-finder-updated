const searchBtn = document.getElementById('search-btn');
const randomBtn = document.getElementById('random-btn');
const searchInput = document.getElementById('search-input');
const resultsArea = document.getElementById('meal-results');
const modal = document.getElementById('recipe-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');
const loadMoreBtn = document.getElementById('load-more-btn');
const recipeCount = document.getElementById('recipe-count');

let allMeals = []; 
let itemsToShow = 6; 

// --- 1. SEARCH LOGIC ---
searchBtn.addEventListener('click', () => {
    const term = searchInput.value.trim();
    performSearch(term);
});

// --- 2. RANDOM/SURPRISE LOGIC ---
randomBtn.addEventListener('click', async () => {
    try {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
        const data = await res.json();
        // Random gives 1 meal, we immediately open its details
        getMealDetails(data.meals[0].idMeal);
    } catch (err) {
        console.error("Random Error:", err);
    }
});

// --- 3. SEARCH ENGINE ---
async function performSearch(term) {
    if (!term) return;
    
    resultsArea.innerHTML = "<p>Cooking up your results...</p>";
    if (recipeCount) recipeCount.innerText = "";

    try {
        const [nameRes, catRes, ingRes] = await Promise.all([
            fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`),
            fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${term}`),
            fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${term}`)
        ]);

        const nData = await nameRes.json();
        const cData = await catRes.json();
        const iData = await ingRes.json();

        const combined = [...(nData.meals || []), ...(cData.meals || []), ...(iData.meals || [])];
        
        // Filter unique meals
        allMeals = combined.filter((meal, index, self) =>
            index === self.findIndex((m) => m.idMeal === meal.idMeal)
        );

        allMeals = shuffle(allMeals);
        itemsToShow = 6;
        renderGrid();
    } catch (err) {
        resultsArea.innerHTML = "<p>Error finding recipes.</p>";
    }
}

// --- 4. THE GRID RENDERER ---
function renderGrid() {
    if (!allMeals || allMeals.length === 0) {
        resultsArea.innerHTML = "<p>No recipes found.</p>";
        if (recipeCount) recipeCount.innerText = "";
        loadMoreBtn.style.display = "none";
        return;
    }

    const currentSlice = allMeals.slice(0, itemsToShow);
    
    // Update Counter
    if (recipeCount) {
        recipeCount.innerText = `Showing ${currentSlice.length} of ${allMeals.length} recipes`;
    }

    // Draw Cards
    resultsArea.innerHTML = currentSlice.map(meal => `
        <div class="meal-card">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="meal-info">
                <h3>${meal.strMeal}</h3>
                <button class="view-btn" data-id="${meal.idMeal}">View Recipe</button>
            </div>
        </div>
    `).join('');

    loadMoreBtn.style.display = itemsToShow < allMeals.length ? "inline-block" : "none";
    attachButtonListeners();
}

// --- 5. MODAL LOGIC ---
async function getMealDetails(id) {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];

    // Ingredients
    let ingHTML = "";
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ing && ing.trim() !== "") {
            ingHTML += `<div class="ingredient-item"><strong>${measure}</strong> ${ing}</div>`;
        }
    }

    // Instructions
    const steps = meal.strInstructions.split(/\r?\n|\.\s+/)
        .map(s => s.trim()).filter(s => s.length > 5);

    modalBody.innerHTML = `
        <img src="${meal.strMealThumb}" class="modal-header-img">
        <div class="recipe-title-section">
            <p>${meal.strArea} • ${meal.strCategory}</p>
            <h2 class="recipe-title">${meal.strMeal}</h2>
        </div>
        <div class="recipe-content">
            <h3>Ingredients</h3>
            <div class="ing-list-container">${ingHTML}</div>
            <h3>Instructions</h3>
            <div class="inst-steps">
                ${steps.map((s, i) => `<div class="step-row"><span class="step-number">${i+1}</span><p>${s}.</p></div>`).join('')}
            </div>
        </div>
    `;
    modal.style.display = "block";
    modal.scrollTop = 0;
}

// --- HELPERS ---
function attachButtonListeners() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = () => getMealDetails(btn.getAttribute('data-id'));
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[array[j]]] = [array[array[j]], array[i]];
    }
    return array;
}

loadMoreBtn.onclick = () => { itemsToShow += 6; renderGrid(); };
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };