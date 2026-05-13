const searchBtn = document.getElementById('search-btn');
const randomBtn = document.getElementById('random-btn');
const searchInput = document.getElementById('search-input');
const resultsArea = document.getElementById('meal-results');
const modal = document.getElementById('recipe-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');
const loadMoreBtn = document.getElementById('load-more-btn');
const countText = document.getElementById('recipe-count');

let allMeals = []; // Global storage for search results
let itemsToShow = 6; // How many to show at once

// --- EVENT LISTENERS ---

searchBtn.addEventListener('click', () => {
    const term = searchInput.value.trim();
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
    // Get a slice of the array (e.g., 0 to 6)
    const currentSlice = allMeals.slice(0, itemsToShow);
    
    resultsArea.innerHTML = currentSlice.map(meal => `
        <div class="meal-card">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <h3>${meal.strMeal}</h3>
            <button class="view-btn" data-id="${meal.idMeal}">View Recipe</button>
        </div>
    `).join('');

    // Re-attach listeners to the new buttons
    attachButtonListeners();

    // Show/Hide the Load More button
    if (itemsToShow < allMeals.length) {
        loadMoreBtn.style.display = "block";
    } else {
        loadMoreBtn.style.display = "none";
    }
}

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
    console.log("Fetching details for ID:", id); // Check your console!
    
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];

    // Get ingredients
    let ingredients = [];
    for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`]) {
            ingredients.push(`${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}`);
        } else break;
    }

    modalBody.innerHTML = `
        <h2 style="color: #ff6b6b;">${meal.strMeal}</h2>
        <img src="${meal.strMealThumb}" style="width: 100%; border-radius: 10px; max-height: 300px; object-fit: cover;">
        <div style="text-align: left; padding: 20px;">
            <h3>Ingredients:</h3>
            <ul>${ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
            <h3>Instructions:</h3>
            <p style="white-space: pre-line;">${meal.strInstructions}</p>
        </div>
    `;
    modal.style.display = "block";
}