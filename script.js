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

// --- EVENT LISTENERS ---

// Single search trigger
searchBtn.addEventListener('click', () => {
    const term = searchInput.value.trim();
    if (term) performSearch(term);
});

// Enter key trigger
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const term = searchInput.value.trim();
        if (term) performSearch(term);
    }
});

// Surprise Me trigger
randomBtn.addEventListener('click', async () => {
    try {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
        const data = await res.json();
        if (data.meals) {
            getMealDetails(data.meals[0].idMeal);
        }
    } catch (err) {
        console.error("Random Error:", err);
    }
});

// Load More trigger
loadMoreBtn.onclick = () => {
    itemsToShow += 6;
    renderGrid();
};

// Modal closing logic
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
};

// Chip/Category trigger
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const value = chip.innerText;
        searchInput.value = value;
        performSearch(value);
    });
});

// --- CORE FUNCTIONS ---

async function performSearch(term) {
    resultsArea.innerHTML = "<p>Cooking up your results...</p>";
    if (recipeCount) recipeCount.innerText = "";

    try {
        // Fetch from 3 endpoints to get the best results
        const [nameRes, catRes, ingRes] = await Promise.all([
            fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`),
            fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${term}`),
            fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${term}`)
        ]);

        const nData = await nameRes.json();
        const cData = await catRes.json();
        const iData = await ingRes.json();

        const combined = [
            ...(nData.meals || []),
            ...(cData.meals || []),
            ...(iData.meals || [])
        ];

        // Remove duplicates
        const uniqueMeals = combined.filter((meal, index, self) =>
            index === self.findIndex((m) => m.idMeal === meal.idMeal)
        );

        allMeals = shuffle(uniqueMeals);
        itemsToShow = 6;
        renderGrid();
    } catch (err) {
        console.error("Search error:", err);
        resultsArea.innerHTML = "<p>Oops! Something went wrong.</p>";
    }
}

function renderGrid() {
    if (!allMeals || allMeals.length === 0) {
        resultsArea.innerHTML = "<p>No recipes found. Try another ingredient!</p>";
        if (recipeCount) recipeCount.innerText = "";
        loadMoreBtn.style.display = "none";
        return;
    }

    const currentSlice = allMeals.slice(0, itemsToShow);
    
    // Update counter at the bottom
    if (recipeCount) {
        recipeCount.innerText = `Showing ${currentSlice.length} of ${allMeals.length} recipes`;
    }

    // Generate Cards
    resultsArea.innerHTML = currentSlice.map(meal => `
        <div class="meal-card">
            <div class="badge">${meal.strCategory || 'Recipe'}</div>
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="meal-info">
                <h3>${meal.strMeal}</h3>
                <p>${meal.strArea || 'International'}</p>
                <button class="view-btn" data-id="${meal.idMeal}">View Recipe</button>
            </div>
        </div>
    `).join('');

    // Toggle Load More visibility
    loadMoreBtn.style.display = itemsToShow < allMeals.length ? "inline-block" : "none";

    attachButtonListeners();
}

async function getMealDetails(id) {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];

    // Build Ingredients
    let ingredientsHTML = "";
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ing && ing.trim() !== "") {
            ingredientsHTML += `
                <div class="ingredient-item">
                    <input type="checkbox" id="ing-${i}">
                    <label for="ing-${i}"><strong>${measure}</strong> ${ing}</label>
                </div>`;
        }
    }

    // Build Instructions
    const instructionSteps = meal.strInstructions
        .split(/\r?\n|\.\s+/)
        .map(step => step.trim())
        .filter(step => step.length > 5 && !/^\d+\.?$/.test(step));

    // Combine into Modal (FIXED TITLE ORDER)
    modalBody.innerHTML = `
        <img src="${meal.strMealThumb}" class="modal-header-img">
        
        <div class="recipe-title-section">
            <p class="recipe-category">${meal.strArea} • ${meal.strCategory}</p>
            <h2 class="recipe-title">${meal.strMeal}</h2>
        </div>

        <div class="recipe-content">
            <h3>Ingredients</h3>
            <div class="ing-list-container">${ingredientsHTML}</div>

            <h3>Instructions</h3>
            <div class="inst-steps">
                ${instructionSteps.map((step, index) => `
                    <div class="step-row">
                        <span class="step-number">${index + 1}</span> 
                        <p>${step}${step.endsWith('.') ? '' : '.'}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    modal.style.display = "block";
    modal.scrollTop = 0;
}

// --- HELPERS ---

function attachButtonListeners() {
    document.querySelectorAll('.view-btn').forEach(button => {
        button.onclick = () => getMealDetails(button.getAttribute('data-id'));
    });
};

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[array[j]]] = [array[array[j]], array[i]];
    }
    return array;
}