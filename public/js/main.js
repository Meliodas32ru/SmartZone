// --- Слайдер ---
let currentIndex = 0;
const slides = document.getElementById('slides');
const totalSlides = slides?.children.length || 0;

function moveSlide(step) {
    currentIndex += step;
    if (currentIndex < 0) currentIndex = totalSlides - 1;
    if (currentIndex >= totalSlides) currentIndex = 0;
    updateSlide();
}

function updateSlide() {
    if (slides) {
        slides.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
}

function autoSlide() {
    moveSlide(1);
}

let slideInterval = setInterval(autoSlide, 4000);

const slider = document.querySelector('.slider');
if (slider) {
    slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
    slider.addEventListener('mouseleave', () => slideInterval = setInterval(autoSlide, 4000));
}

// --- Работа с корзиной ---
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item => item.id === (product._id || product.id));

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({
      id: product._id || product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      color: product.color,
      photo: product.photo,
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`Товар "${product.name}" добавлен в корзину!`);
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCount = document.querySelector('.cart-count');

  if (cartCount) {
    cartCount.setAttribute('data-count', count);
    cartCount.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// --- Логика категорий ---
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', (event) => {
    event.preventDefault();
    const selectedBrand = card.dataset.brand;
    localStorage.setItem('selectedBrand', selectedBrand);
    window.location.href = 'catalog.html';
  });
});

// --- Каталог товаров ---
let allProducts = [];
let currentSort = "default";

async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    allProducts = await response.json();
    displayProducts(allProducts);
    initSearchAndSort();
  } catch (error) {
    console.error("Ошибка загрузки товаров:", error);
  }
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.id = product._id;

  card.innerHTML = `
    <img src="${product.photo}" alt="${product.name}">
    <h3>${product.name}</h3>
    <p>${product.brand}</p>
    <p>Цена: ${product.price.toFixed(2)} руб.</p>
    <p>Цвет: ${product.color}</p>
    <button class="product-card__button">Добавить в корзину</button>
  `;

  card.querySelector(".product-card__button").addEventListener("click", () => addToCart(product));
  return card;
}

function displayProducts(products) {
  const catalog = document.getElementById("catalog");
  if (!catalog) return;

  catalog.innerHTML = "";
  const sortedProducts = sortProducts(products, currentSort);

  if (sortedProducts.length === 0) {
    catalog.innerHTML = "<p>Товары не найдены.</p>";
  } else {
    sortedProducts.forEach(product => catalog.appendChild(createProductCard(product)));
  }
}

function sortProducts(products, sortType) {
  if (sortType === "asc") {
    return products.slice().sort((a, b) => a.price - b.price);
  } else if (sortType === "desc") {
    return products.slice().sort((a, b) => b.price - a.price);
  }
  return products;
}

function applyFiltersAndSorting() {
  const searchInput = document.getElementById("search-input");
  const term = searchInput ? searchInput.value.toLowerCase() : "";
  const activeBrandButton = document.querySelector('.brand-filter.active');
  const selectedBrand = activeBrandButton ? activeBrandButton.dataset.brand : "all";

  const filtered = allProducts.filter(product => {
    const matchBrand = selectedBrand === "all" || product.brand === selectedBrand;
    const matchSearch = product.name.toLowerCase().includes(term) || product.brand.toLowerCase().includes(term);
    return matchBrand && matchSearch;
  });

  displayProducts(filtered);
}

function initSearchAndSort() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
  }

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      applyFiltersAndSorting();
    });
  });

  document.querySelectorAll('.brand-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.brand-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFiltersAndSorting();
    });
  });
}

function filterProducts() {
  applyFiltersAndSorting();
}

// --- Инициализация ---
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  const selectedBrand = localStorage.getItem('selectedBrand');

  loadProducts().then(() => {
    if (selectedBrand) {
      filterByBrand(selectedBrand);
      localStorage.removeItem('selectedBrand');
    }
  });
});

function filterByBrand(brand) {
  const filtered = brand === "all" ? allProducts : allProducts.filter(p => p.brand === brand);
  displayProducts(filtered);

  document.querySelectorAll('.brand-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.brand === brand);
  });
}
