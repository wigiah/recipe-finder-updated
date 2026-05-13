const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const resultsArea = document.getElementById('meal-results');
const randomBtn = document.getElementById('random-btn');
const modal = document.getElementById('recipe-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');

closeBtn.onclick = () => modal.style.display = "none";

searchBtn.addEventListener('click', () => {
    const ingredient = searchInput.value.trim().replace(' ', '_'); // API likes underscores for spaces
    if (ingredient) {
        fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`)
            .then(res => res.json())
            .then(data => {
                if (data.meals) {
                    displayMeals(data.meals);
                } else {
                    resultsArea.innerHTML = "<p>No recipes found with that ingredient.</p>";
                }
            });
    }
});

randomBtn.addEventListener('click', () => {
    // Clear previous results and input
    resultsArea.innerHTML = "<p>Picking a delicious surprise...</p>";
    searchInput.value = "";

    fetch('https://www.themealdb.com/api/json/v1/1/random.php')
        .then(res => res.json())
        .then(data => {
            // The random endpoint returns an array with 1 item
            displayMeals(data.meals);
        })
        .catch(err => {
            console.error(err);
            resultsArea.innerHTML = "<p>Oops! The chef is confused. Try again.</p>";
        });
});

function displayMeals(meals) {
    resultsArea.innerHTML = meals ? meals.map(meal => `
        <div class="meal-card">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <h3>${meal.strMeal}</h3>
            <p>${meal.strCategory} | ${meal.strArea}</p>
            <a href="${meal.strYoutube}" target="_blank">Watch Video</a>
        </div>
    `).join('') : '<p>No meals found. Try again!</p>';
};
async function getMealDetails(id) {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];

    // Build the ingredients list (The API gives these as strIngredient1, strIngredient2...)
    let ingredients = [];
    for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`]) {
            ingredients.push(`${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}`);
        } else break;
    }

    modalBody.innerHTML = `
        <h2>${meal.strMeal}</h2>
        <img src="${meal.strMealThumb}" style="width: 100%; border-radius: 10px;">
        <h3>Ingredients:</h3>
        <ul>${ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
        <h3>Instructions:</h3>
        <p style="text-align: left; line-height: 1.6;">${meal.strInstructions}</p>
    `;
    modal.style.display = "block";
}