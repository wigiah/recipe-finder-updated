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
        return;
    }

    allMeals = meals; // Save the full list
    itemsToShow = 6;  // Reset to 6 for every new search
    renderGrid();     // Call a sub-function to draw the cards
    countText.innerText = `Showing ${currentSlice.length} of ${meals.length} recipes`;
}

function renderGrid() {
    // 1. Safety check: make sure we actually have meals to show
    if (!allMeals || allMeals.length === 0) {
        resultsArea.innerHTML = "<p>No recipes to display.</p>";
        recipeCount.innerText = "";
        loadMoreBtn.style.display = "none";
        return;
    }

    // 2. Get the specific slice of meals (e.g., first 6, then first 12, etc.)
    const currentSlice = allMeals.slice(0, itemsToShow);
    
    // 3. Update the Counter Text
    recipeCount.innerText = `Showing ${currentSlice.length} of ${allMeals.length} recipes`;

    // 4. Generate the HTML for the cards
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

    // 5. Handle the "Load More" button visibility
    if (itemsToShow < allMeals.length) {
        loadMoreBtn.style.display = "block";
    } else {
        loadMoreBtn.style.display = "none";
    }

    // 6. Re-attach event listeners to the NEW "View Recipe" buttons
    attachButtonListeners();
}

// Helper function to make sure the "View Recipe" buttons actually work
function attachButtonListeners() {
    const detailButtons = document.querySelectorAll('.view-btn');
    detailButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mealId = button.getAttribute('data-id');
            getMealDetails(mealId); // This calls your modal function
        });
    });
};

// Function for the Load More button
loadMoreBtn.addEventListener('click', () => {
    itemsToShow += 6; // Increase the count by 6
    renderGrid();
});

// Helper to keep the code clean
function attachButtonListeners() {
    document.querySelectorAll('.view-btn').forEach(button => {
        button.onclick = () => getMealDetails(button.getAttribute('data-id'));
    });
};

async function getMealDetails(id) {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];
    

    // 1. Format Ingredients (Same as before)
    let ingredients = [];
    for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`]) {
            ingredients.push(`${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}`);
        } else break;
    }

    // 2. FORMAT INSTRUCTIONS:
    // Split text by periods followed by a space, then filter out empty strings
    const instructionSteps = meal.strInstructions
        .split(/\.\s+/)
        .map(step => step.trim()) // Clean up whitespace
    // 2. This filter removes steps that are ONLY numbers or too short
        .filter(step => {
            const isJustNumber = /^\d+\.?$/.test(step); // Checks if it's "1" or "1."
            return step.length > 2 && !isJustNumber;
        });

    modalBody.innerHTML = `
        <div class="inst-steps">
            ${instructionSteps.map(step => `
                <p>
                    <span class="step-bullet">•</span> 
                    ${step}${step.endsWith('.') ? '' : '.'}
                </p>
            `).join('')}
        </div>
    `;
    modal.style.display = "block";
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

        // Remove duplicates (so you don't see the same meal twice)
        allMeals = combined.filter((meal, index, self) =>
            index === self.findIndex((m) => m.idMeal === meal.idMeal)
        );

        itemsToShow = 6;
        renderGrid();

    } catch (err) {
        console.error("Search error:", err);
        resultsArea.innerHTML = "<p>Oops! Something went wrong.</p>";
    }
}