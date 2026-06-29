const BASE_URL = "https://www.themealdb.com/api/json/v1/1"
const OFF_URL = "https://world.openfoodfacts.org/cgi/search.pl"

let allMeals = []
let currentMeal = null

function getId(id) {
    return document.getElementById(id)
}

let searchFiltersSection = getId("search-filters-section")
let mealCategoriesSection = getId("meal-categories-section")
let allRecipesSection = getId("all-recipes-section")
let mealDetailsSection = getId("meal-details")
let productsSection = getId("products-section")
let foodlogSection = getId("foodlog-section")

const navLinks = document.querySelectorAll(".nav-link")

function showPage(page) {
    searchFiltersSection.style.display = "none"
    mealCategoriesSection.style.display = "none"
    allRecipesSection.style.display = "none"
    mealDetailsSection.style.display = "none"
    productsSection.style.display = "none"
    foodlogSection.style.display = "none"

    if (page == "meals") {
        searchFiltersSection.style.display = ""
        mealCategoriesSection.style.display = ""
        allRecipesSection.style.display = ""
    } else if (page == "details") {
        mealDetailsSection.style.display = ""
    } else if (page == "products") {
        productsSection.style.display = ""
    } else if (page == "foodlog") {
        foodlogSection.style.display = ""
    }

    let titles = {
        meals: ["Meals & Recipes", "Discover delicious and nutritious recipes"],
        details: ["Meal Details", "Full recipe and nutrition info"],
        products: ["Product Scanner", "Search packaged food products"],
        foodlog: ["Food Log", "Track your daily nutrition intake"]
    }

    let h = document.querySelector("#header h1")
    let p = document.querySelector("#header p")
    if (h) h.textContent = titles[page][0]
    if (p) p.textContent = titles[page][1]

    let pagesList = ["meals", "products", "foodlog"]
    for (let i = 0; i < navLinks.length; i++) {
        let link = navLinks[i]
        let active = pagesList[i] === page || (page === "details" && pagesList[i] === "meals")
        if (active) {
            link.classList.add("bg-emerald-50", "text-emerald-700")
            link.classList.remove("text-gray-600", "hover:bg-gray-50")
        } else {
            link.classList.remove("bg-emerald-50", "text-emerald-700")
            link.classList.add("text-gray-600", "hover:bg-gray-50")
        }
    }

    closeSidebar()
}

let sidebar = getId("sidebar")
let sidebarOverlay = getId("sidebar-overlay")

function openSidebar() {
    sidebar.classList.add("open")
    sidebarOverlay.classList.add("active")
}
function closeSidebar() {
    sidebar.classList.remove("open")
    sidebarOverlay.classList.remove("active")
}

getId("header-menu-btn").addEventListener("click", openSidebar)
getId("sidebar-close-btn").addEventListener("click", closeSidebar)
sidebarOverlay.addEventListener("click", closeSidebar)

navLinks[0].addEventListener("click", function(e) { e.preventDefault(); showPage("meals") })
navLinks[1].addEventListener("click", function(e) { e.preventDefault(); showPage("products") })
navLinks[2].addEventListener("click", function(e) { e.preventDefault(); showPage("foodlog") })

async function fetchData(url) {
    let res = await fetch(url)
    if (!res.ok) throw new Error("something went wrong")
    return res.json()
}

let catIcons = {
    Beef: { icon: "fa-drumstick-bite", color: "from-red-400 to-red-500" },
    Chicken: { icon: "fa-drumstick-bite", color: "from-orange-400 to-orange-500" },
    Dessert: { icon: "fa-cake-candles", color: "from-pink-400 to-pink-500" },
    Lamb: { icon: "fa-cow", color: "from-amber-400 to-amber-500" },
    Miscellaneous: { icon: "fa-bowl-food", color: "from-gray-400 to-gray-500" },
    Pasta: { icon: "fa-bowl-food", color: "from-yellow-400 to-yellow-500" },
    Pork: { icon: "fa-bacon", color: "from-rose-400 to-rose-500" },
    Seafood: { icon: "fa-fish", color: "from-blue-400 to-blue-500" },
    Side: { icon: "fa-utensils", color: "from-teal-400 to-teal-500" },
    Starter: { icon: "fa-utensils", color: "from-emerald-400 to-emerald-500" },
    Vegan: { icon: "fa-leaf", color: "from-green-400 to-green-500" },
    Vegetarian: { icon: "fa-carrot", color: "from-lime-400 to-lime-500" }
}

async function loadCategories() {
    let data = await fetchData(BASE_URL + "/categories.php")
    let grid = getId("categories-grid")
    grid.innerHTML = ""

    let skip = ["Breakfast", "Goat"]

    for (let i = 0; i < data.categories.length; i++) {
        let cat = data.categories[i]
        if (skip.includes(cat.strCategory)) continue

        let style = catIcons[cat.strCategory]
        if (!style) style = { icon: "fa-utensils", color: "from-emerald-400 to-green-500" }

        let card = document.createElement("div")
        card.className = "category-card bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group"
        card.dataset.category = cat.strCategory
        card.innerHTML = `
          <div class="flex items-center gap-2.5">
            <div class="text-white w-9 h-9 bg-gradient-to-br ${style.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <i class="fa-solid ${style.icon}"></i>
            </div>
            <div><h3 class="text-sm font-bold text-gray-900">${cat.strCategory}</h3></div>
          </div>`
        card.addEventListener("click", function() { filterByCategory(cat.strCategory) })
        grid.appendChild(card)
    }
}

async function loadMeals() {
    let cats = ["Beef", "Chicken", "Seafood", "Pasta", "Dessert"]
    let meals = []

    for (let i = 0; i < cats.length; i++) {
        let data = await fetchData(BASE_URL + "/filter.php?c=" + cats[i])
        if (data.meals) {
            meals = meals.concat(data.meals.slice(0, 5))
        }
    }

    allMeals = meals.slice(0, 25)
    renderMeals(allMeals)
}

function renderMeals(meals) {
    let grid = getId("recipes-grid")
    let countEl = getId("recipes-count")
    grid.innerHTML = ""
    countEl.textContent = "Showing " + meals.length + " recipes"

    if (meals.length == 0) {
        grid.innerHTML = `<div class="col-span-4 text-center py-16 text-gray-400">
          <i class="fa-solid fa-utensils text-5xl mb-3"></i>
          <p class="text-lg font-medium">No recipes found</p></div>`
        return
    }

    for (let i = 0; i < meals.length; i++) {
        let meal = meals[i]
        let card = document.createElement("div")
        card.className = "recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
        card.innerHTML = `
          <div class="relative h-48 overflow-hidden">
            <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                 src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy"/>
          </div>
          <div class="p-4">
            <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${meal.strMeal}</h3>
            <p class="text-xs text-gray-500">Click to see full recipe</p>
          </div>`
        card.addEventListener("click", function() { openMealDetails(meal.idMeal) })
        grid.appendChild(card)
    }
}

async function filterByCategory(category) {
    let grid = getId("recipes-grid")
    grid.innerHTML = `<div class="col-span-4 text-center py-8 text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-3xl"></i></div>`

    let data = await fetchData(BASE_URL + "/filter.php?c=" + category)
    let meals = []
    if (data.meals) meals = data.meals.slice(0, 25)
    allMeals = meals
    renderMeals(meals)
}

let searchTimeout
getId("search-input").addEventListener("input", function(e) {
    clearTimeout(searchTimeout)
    let q = e.target.value.trim()
    if (!q) {
        renderMeals(allMeals)
        return
    }
    searchTimeout = setTimeout(async function() {
        let data = await fetchData(BASE_URL + "/search.php?s=" + encodeURIComponent(q))
        renderMeals(data.meals || [])
    }, 400)
})

async function openMealDetails(id) {
    showPage("details")
    let data = await fetchData(BASE_URL + "/lookup.php?i=" + id)
    currentMeal = data.meals[0]
    fillMealDetails(currentMeal)
}

function fillMealDetails(meal) {
    let heroImg = document.querySelector("#meal-details .relative.h-80 img")
    if (heroImg) {
        heroImg.src = meal.strMealThumb
        heroImg.alt = meal.strMeal
    }

    let heroTitle = document.querySelector("#meal-details h1")
    if (heroTitle) heroTitle.textContent = meal.strMeal

    let badgesEl = document.querySelector("#meal-details .absolute.bottom-0 .flex.items-center.gap-3")
    if (badgesEl) {
        badgesEl.innerHTML = `
          <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${meal.strCategory || ""}</span>
          <span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${meal.strArea || ""}</span>`
    }

    let ingredients = []
    for (let i = 1; i <= 20; i++) {
        let ing = meal["strIngredient" + i]
        let mea = meal["strMeasure" + i]
        if (ing && ing.trim()) {
            ingredients.push({ ing: ing, mea: mea || "" })
        }
    }

    let ingGrid = document.querySelector("#meal-details .grid.grid-cols-1.md\\:grid-cols-2.gap-3")
    if (ingGrid) {
        let html = ""
        for (let i = 0; i < ingredients.length; i++) {
            html += `<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
              <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300"/>
              <span class="text-gray-700"><span class="font-medium text-gray-900">${ingredients[i].mea}</span> ${ingredients[i].ing}</span>
            </div>`
        }
        ingGrid.innerHTML = html

        let ingCount = document.querySelector("#meal-details .text-sm.font-normal.text-gray-500.ml-auto")
        if (ingCount) ingCount.textContent = ingredients.length + " items"
    }

    let stepsEl = document.querySelector("#meal-details .space-y-4")
    if (stepsEl && meal.strInstructions) {
        let steps = meal.strInstructions.split("\n").filter(function(s) { return s.trim() })
        let stepsHtml = ""
        for (let i = 0; i < steps.length; i++) {
            stepsHtml += `<div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${i + 1}</div>
              <p class="text-gray-700 leading-relaxed pt-2">${steps[i]}</p>
            </div>`
        }
        stepsEl.innerHTML = stepsHtml
    }

    if (meal.strYoutube) {
        let videoId = meal.strYoutube.split("v=")[1]
        let iframe = document.querySelector("#meal-details iframe")
        if (iframe) iframe.src = "https://www.youtube.com/embed/" + videoId
    }

    let logBtn = getId("log-meal-btn")
    if (logBtn) {
        logBtn.onclick = function() { logMeal(meal) }
    }
}

getId("back-to-meals-btn").addEventListener("click", function() { showPage("meals") })

const STORAGE_KEY = "nutriplan_log"
const GOALS = { calories: 2000, protein: 50, carbs: 250, fat: 65 }

function getLog() {
    let data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
}

function saveLog(log) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
}

function logMeal(meal) {
    let log = getLog()
    let entry = {
        id: meal.idMeal || Date.now(),
        name: meal.strMeal || "Unknown",
        thumb: meal.strMealThumb || "",
        calories: Math.round(Math.random() * 300 + 200),
        protein: Math.round(Math.random() * 30 + 10),
        carbs: Math.round(Math.random() * 50 + 20),
        fat: Math.round(Math.random() * 15 + 5),
        date: new Date().toDateString(),
        type: "meal"
    }
    log.push(entry)
    saveLog(log)

    Swal.fire({
        icon: "success",
        title: "Meal Logged!",
        text: entry.name + " added to your Food Log.",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end"
    })
}

function renderFoodLog() {
    let todayStr = new Date().toDateString()
    let log = getLog().filter(function(e) { return e.date === todayStr })
    let list = getId("logged-items-list")
    let clearBtn = getId("clear-foodlog")

    getId("foodlog-date").textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long", month: "short", day: "numeric"
    })

    let totalCal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
    for (let i = 0; i < log.length; i++) {
        totalCal += log[i].calories || 0
        totalProtein += log[i].protein || 0
        totalCarbs += log[i].carbs || 0
        totalFat += log[i].fat || 0
    }

    updateProgress("Calories", totalCal, GOALS.calories, "kcal")
    updateProgress("Protein", totalProtein, GOALS.protein, "g")
    updateProgress("Carbs", totalCarbs, GOALS.carbs, "g")
    updateProgress("Fat", totalFat, GOALS.fat, "g")

    let countLabel = document.querySelector("#foodlog-today-section h4")
    if (countLabel) countLabel.textContent = "Logged Items (" + log.length + ")"

    if (log.length > 0) {
        clearBtn.style.display = ""
    } else {
        clearBtn.style.display = "none"
    }

    if (log.length == 0) {
        list.innerHTML = `<div class="text-center py-8 text-gray-500">
          <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
          <p class="font-medium">No meals logged today</p>
          <p class="text-sm">Add meals from the Meals page or scan products</p>
        </div>`
        return
    }

    let html = ""
    for (let i = 0; i < log.length; i++) {
        let entry = log[i]
        let imgHtml = ""
        if (entry.thumb) {
            imgHtml = `<img src="${entry.thumb}" class="w-12 h-12 rounded-lg object-cover"/>`
        } else {
            imgHtml = `<div class="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center"><i class="fa-solid fa-utensils text-emerald-500"></i></div>`
        }
        html += `<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          ${imgHtml}
          <div class="flex-1">
            <p class="font-semibold text-gray-900 text-sm">${entry.name}</p>
            <p class="text-xs text-gray-500">${entry.calories} kcal · P:${entry.protein}g · C:${entry.carbs}g · F:${entry.fat}g</p>
          </div>
          <button onclick="removeEntry(${i})" class="text-red-400 hover:text-red-600 ml-2">
            <i class="fa-solid fa-trash text-sm"></i>
          </button>
        </div>`
    }
    list.innerHTML = html

    drawWeeklyChart()
}

function updateProgress(label, current, goal, unit) {
    let cards = document.querySelectorAll("#foodlog-today-section .rounded-xl.p-4")
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i]
        let labelEl = card.querySelector(".text-sm.font-semibold")
        if (labelEl && labelEl.textContent.trim() === label) {
            let valEl = card.querySelector(".text-sm.text-gray-500")
            let bar = card.querySelector(".h-2\\.5.rounded-full:not(.bg-gray-200)")
            let pct = Math.min((current / goal) * 100, 100).toFixed(1)
            if (valEl) valEl.textContent = current + " / " + goal + " " + unit
            if (bar) bar.style.width = pct + "%"
        }
    }
}

window.removeEntry = function(idx) {
    let log = getLog()
    let todayLog = log.filter(function(e) { return e.date === new Date().toDateString() })
    let target = todayLog[idx]
    let pos = log.findIndex(function(e) { return e.name === target.name && e.date === target.date })
    if (pos !== -1) log.splice(pos, 1)
    saveLog(log)
    renderFoodLog()
}

getId("clear-foodlog").addEventListener("click", function() {
    Swal.fire({
        title: "Clear all logged items?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Yes, clear it!"
    }).then(function(result) {
        if (result.isConfirmed) {
            let log = getLog().filter(function(e) { return e.date !== new Date().toDateString() })
            saveLog(log)
            renderFoodLog()
        }
    })
})

let quickBtns = document.querySelectorAll(".quick-log-btn")
quickBtns[0].addEventListener("click", function() { showPage("meals") })
quickBtns[1].addEventListener("click", function() { showPage("products") })

function drawWeeklyChart() {
    let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    let log = getLog()
    let calsByDay = []

    for (let i = 0; i < days.length; i++) {
        let d = new Date()
        d.setDate(d.getDate() - (6 - i))
        let dayStr = d.toDateString()
        let total = 0
        for (let j = 0; j < log.length; j++) {
            if (log[j].date === dayStr) total += log[j].calories || 0
        }
        calsByDay.push(total)
    }

    Plotly.newPlot("weekly-chart", [{ x: days, y: calsByDay, type: "bar", marker: { color: "#10b981" }, name: "Calories" }], {
        margin: { t: 10, b: 30, l: 40, r: 10 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        yaxis: { gridcolor: "#f3f4f6" }
    }, { responsive: true, displayModeBar: false })
}

getId("search-product-btn").addEventListener("click", searchProducts)
getId("lookup-barcode-btn").addEventListener("click", lookupBarcode)

getId("product-search-input").addEventListener("keydown", function(e) {
    if (e.key === "Enter") searchProducts()
})
getId("barcode-input").addEventListener("keydown", function(e) {
    if (e.key === "Enter") lookupBarcode()
})

async function searchProducts() {
    let q = getId("product-search-input").value.trim()
    if (!q) return

    getId("products-grid").innerHTML = `<div class="col-span-4 text-center py-8 text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-3xl"></i></div>`

    let url = OFF_URL + "?search_terms=" + encodeURIComponent(q) + "&search_simple=1&action=process&json=1&page_size=12&fields=id,product_name,brands,image_url,nutriments,nutriscore_grade,nova_group,quantity"
    let data = await fetchData(url)
    renderProducts(data.products || [])
}

async function lookupBarcode() {
    let code = getId("barcode-input").value.trim()
    if (!code) return

    let data = await fetchData("https://world.openfoodfacts.org/api/v0/product/" + code + ".json")
    if (data.status === 1) {
        renderProducts([data.product])
    } else {
        getId("products-grid").innerHTML = `<div class="col-span-4 text-center py-8 text-red-400">
          <i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
          <p>Product not found</p></div>`
    }
}

function renderProducts(products) {
    let grid = getId("products-grid")
    let countEl = getId("products-count")
    countEl.textContent = products.length + " product(s) found"

    if (products.length == 0) {
        grid.innerHTML = `<div class="col-span-4 text-center py-8 text-gray-400"><p>No products found.</p></div>`
        return
    }

    let gradeColors = { A: "bg-green-500", B: "bg-lime-500", C: "bg-yellow-500", D: "bg-orange-500", E: "bg-red-500" }
    let html = ""

    for (let i = 0; i < products.length; i++) {
        let p = products[i]
        let n = p.nutriments || {}
        let grade = (p.nutriscore_grade || "?").toUpperCase()
        let color = gradeColors[grade] || "bg-gray-400"
        let cal = Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0)
        let prot = Math.round(n.proteins_100g || 0)
        let carbs = Math.round(n.carbohydrates_100g || 0)
        let fat = Math.round(n.fat_100g || 0)
        let sugar = Math.round(n.sugars_100g || 0)

        let imgHtml = p.image_url
            ? `<img src="${p.image_url}" alt="${p.product_name || ""}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" loading="lazy"/>`
            : `<i class="fa-solid fa-box text-4xl text-gray-300"></i>`

        let novaHtml = p.nova_group
            ? `<div class="absolute top-2 right-2 bg-lime-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">${p.nova_group}</div>`
            : ""

        html += `<div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group">
          <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
            ${imgHtml}
            <div class="absolute top-2 left-2 ${color} text-white text-xs font-bold px-2 py-1 rounded uppercase">Nutri-Score ${grade}</div>
            ${novaHtml}
          </div>
          <div class="p-4">
            <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${p.brands || "Unknown Brand"}</p>
            <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${p.product_name || "Unknown Product"}</h3>
            <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span><i class="fa-solid fa-weight-scale mr-1"></i>${p.quantity || "N/A"}</span>
              <span><i class="fa-solid fa-fire mr-1"></i>${cal} kcal/100g</span>
            </div>
            <div class="grid grid-cols-4 gap-1 text-center mb-3">
              <div class="bg-emerald-50 rounded p-1.5"><p class="text-xs font-bold text-emerald-700">${prot}g</p><p class="text-[10px] text-gray-500">Protein</p></div>
              <div class="bg-blue-50 rounded p-1.5"><p class="text-xs font-bold text-blue-700">${carbs}g</p><p class="text-[10px] text-gray-500">Carbs</p></div>
              <div class="bg-purple-50 rounded p-1.5"><p class="text-xs font-bold text-purple-700">${fat}g</p><p class="text-[10px] text-gray-500">Fat</p></div>
              <div class="bg-orange-50 rounded p-1.5"><p class="text-xs font-bold text-orange-700">${sugar}g</p><p class="text-[10px] text-gray-500">Sugar</p></div>
            </div>
            <button onclick="logProduct(${JSON.stringify(p).replace(/"/g, '&quot;')})"
              class="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all">
              <i class="fa-solid fa-plus mr-1"></i>Add to Food Log
            </button>
          </div>
        </div>`
    }
    grid.innerHTML = html
}

window.logProduct = function(p) {
    let n = p.nutriments || {}
    let entry = {
        id: p.id || Date.now(),
        name: p.product_name || "Unknown Product",
        thumb: p.image_url || "",
        calories: Math.round(n["energy-kcal_100g"] || 0),
        protein: Math.round(n.proteins_100g || 0),
        carbs: Math.round(n.carbohydrates_100g || 0),
        fat: Math.round(n.fat_100g || 0),
        date: new Date().toDateString(),
        type: "product"
    }
    let log = getLog()
    log.push(entry)
    saveLog(log)

    Swal.fire({
        icon: "success",
        title: "Added to Food Log!",
        text: entry.name,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end"
    })
}

document.querySelectorAll(".nutri-score-filter").forEach(function(btn) {
    btn.addEventListener("click", function() {
        let grade = btn.dataset.grade
        document.querySelectorAll(".product-card").forEach(function(card) {
            if (!grade) { card.style.display = ""; return }
            let badge = Array.from(card.querySelectorAll("div")).find(function(d) { return d.textContent.includes("Nutri-Score") })
            let match = badge && badge.textContent.includes(grade.toUpperCase())
            card.style.display = match ? "" : "none"
        })
    })
})

async function init() {
    try {
        showPage("meals")
        loadCategories()
        await loadMeals()
        renderFoodLog()

        let overlay = getId("app-loading-overlay")
        if (overlay) {
            overlay.style.opacity = "0"
            setTimeout(function() { overlay.style.display = "none" }, 500)
        }
    } catch (err) {
        console.error(err)
    }
}

init()
