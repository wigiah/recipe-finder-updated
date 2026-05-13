const searchBtn = document.getElementById('search-btn');
const randomBtn = document.getElementById('random-btn');
const searchInput = document.getElementById('search-input');
const resultsArea = document.getElementById('meal-results');
const modal = document.getElementById('recipe-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');
const loadMoreBtn = document.getElementById('load-more-btn');
const countText = document.getElementById('recipe-count');
const recipeCount = document.getElementById('recipe-count');

let allMeals = []; // Global storage for search results
let itemsToShow = 6; // How many to show at once

// --- EVENT LISTENERS ---

searchBtn.addEventListener('click', () => {
    const term = searchInput.value.trim();
    performSearch(term);
    if (term) {
        // We use 's=' for search by name
        fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`)
            .then(res => res.json())
            .then(data => {
                allMeals = data.meals; // Store all results
                itemsToShow = 6;       // Reset view count
                displayMeals(allMeals); 
            })
            .catch(err => console.error("Search Error:", err));
    }
});

randomBtn.addEventListener('click', () => {
    fetch('https://www.themealdb.com/api/json/v1/1/random.php')
        .then(res => res.json())
        .then(data => displayMeals(data.meals))
        .catch(err => console.error("Random Error:", err));
});

closeBtn.onclick = () => modal.style.display = "none";

// Close modal if user clicks outside the white box
window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
};

// --- FUNCTIONS ---

function displayMeals(meals) {
    if (!meals) {
        resultsArea.innerHTML = "<p>No recipes found.</p>";
        loadMoreBtn.style.display = "none";
        // Safe check for the recipe count element
        const counter = document.getElementById('recipe-count');
        if (counter) counter.innerText = "";
        return;
    }

    allMeals = meals; 
    itemsToShow = 6;  
    renderGrid(); // This will trigger the drawing of recipes
};

function renderGrid() {
    if (!allMeals || allMeals.length === 0) return;

    const currentSlice = allMeals.slice(0, itemsToShow);
    
    // Update the counter at the bottom
    const counter = document.getElementById('recipe-count');
    if (counter) {
        counter.innerText = `Showing ${currentSlice.length} of ${allMeals.length} recipes`;
    }

    // Draw the cards
    resultsArea.innerHTML = currentSlice.map(meal => `
        <div class="meal-card">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="meal-info">
                <h3>${meal.strMeal}</h3>
                <button class="view-btn" data-id="${meal.idMeal}">View Recipe</button>
            </div>
        </div>
    `).join('');

    // Handle button visibility
    loadMoreBtn.style.display = itemsToShow < allMeals.length ? "inline-block" : "none";

    attachButtonListeners();
};

// Function for the Load More button
loadMoreBtn.addEventListener('click', () => {
    itemsToShow += 6; // Increase the count by 6
    renderGrid();
});

async function getMealDetails(id) {
    // Show a tiny loading state inside the modal if you want
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];

    // 1. Re-build the Ingredients List
    let ingredientsListHTML = "";
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
    
        if (ingredient && ingredient.trim() !== "") {
            ingredientsListHTML += `
                <div class="ingredient-item">
                    <input type="checkbox" id="ing-${i}">
                    <label for="ing-${i}">
                        <strong>${measure}</strong> ${ingredient}
                    </label>
                </div>`;
        }
    };

    // 2. Format Instructions (The "Number-Remover" Logic)
    const instructionSteps = meal.strInstructions
        .split(/\r?\n|\.\s+/) // Splits by New Line OR Period
        .map(step => step.trim())
        .filter(step => step.length > 5 && !/^\d+\.?$/.test(step));

    // 3. Combine everything into the Modal
    modalBody.innerHTML = `
        <img src="${meal.strMealThumb}" class="modal-header-img">
    
        <div class="recipe-title-section">
            <p class="recipe-category">${meal.strArea} • ${meal.strCategory}</p>
            <h2 class="recipe-title">${meal.strMeal}</h2>
        </div>

        <div class="recipe-content">
            <h3>Ingredients</h3>
            <div class="ing-list-container">
                ${ingredientsListHTML}
            </div>

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
    // Scroll modal to top in case it was left scrolled down
    modal.scrollTop = 0;
};

document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const value = chip.innerText;
        searchInput.value = value; // Put the word in the input
        performSearch(value);      // Run the search function
    });
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch(searchInput.value.trim());
    }
});

// To keep things clean, let's wrap your fetch logic into one function
async function performSearch(term) {
    if (!term) return;
    
    resultsArea.innerHTML = "<p>Cooking up your results...</p>";
    recipeCount.innerText = "";

    try {
        // Run three searches at the same time for maximum results!
        const [nameRes, catRes, ingRes] = await Promise.all([
            fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`),
            fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${term}`),
            fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${term}`)
        ]);

        const nameData = await nameRes.json();
        const catData = await catRes.json();
        const ingData = await ingRes.json();

        // Combine all three lists into one big array
        const combined = [
            ...(nameData.meals || []),
            ...(catData.meals || []),
            ...(ingData.meals || [])
        ];
        const uniqueMeals = combined.filter((meal, index, self) =>
            index === self.findIndex((m) => m.idMeal === meal.idMeal)
        );

        // Remove duplicates (so you don't see the same meal twice)
        allMeals = combined.filter((meal, index, self) =>
            index === self.findIndex((m) => m.idMeal === meal.idMeal)
        );
        
        allMeals = shuffle(uniqueMeals);
        itemsToShow = 6;
        renderGrid();

    } catch (err) {
        console.error("Search error:", err);
        resultsArea.innerHTML = "<p>Oops! Something went wrong.</p>";
    }
};

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[array[j]]] = [array[array[j]], array[i]];
    }
    return array;
};

function attachButtonListeners() {
    document.querySelectorAll('.view-btn').forEach(button => {
        button.onclick = () => {
            const mealId = button.getAttribute('data-id');
            getMealDetails(mealId);
        };
    });
};