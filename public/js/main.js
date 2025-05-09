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
let minPrice = 0;
let maxPrice = 0;
let currentMinPrice = 0;
let currentMaxPrice = 0;

async function loadProducts() {
    try {
        const response = await fetch("/api/products");
        allProducts = await response.json();
        
        // Определяем минимальную и максимальную цену
        if (allProducts.length > 0) {
            minPrice = Math.min(...allProducts.map(p => p.price));
            maxPrice = Math.max(...allProducts.map(p => p.price));
            currentMinPrice = minPrice;
            currentMaxPrice = maxPrice;
            
            // Инициализируем ползунок цены
            initPriceSlider();
        }
        
        displayProducts(allProducts);
        initSearchAndSort();
    } catch (error) {
        console.error("Ошибка загрузки товаров:", error);
    }
}

function initPriceSlider() {
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    const priceThumbMin = document.getElementById('price-thumb-min');
    const priceThumbMax = document.getElementById('price-thumb-max');
    const priceTrack = document.getElementById('price-track');
    const applyBtn = document.getElementById('apply-price-filter');
    
    // Устанавливаем начальные значения
    priceMinInput.placeholder = minPrice;
    priceMaxInput.placeholder = maxPrice;
    priceMinInput.min = minPrice;
    priceMaxInput.min = minPrice;
    priceMinInput.max = maxPrice;
    priceMaxInput.max = maxPrice;
    
    // Обновляем позиции ползунков
    function updateSlider() {
        const minPercent = ((currentMinPrice - minPrice) / (maxPrice - minPrice)) * 100;
        const maxPercent = ((currentMaxPrice - minPrice) / (maxPrice - minPrice)) * 100;
        
        priceThumbMin.style.left = `${minPercent}%`;
        priceThumbMax.style.left = `${maxPercent}%`;
        priceTrack.style.left = `${minPercent}%`;
        priceTrack.style.width = `${maxPercent - minPercent}%`;
        
        priceMinInput.value = currentMinPrice !== minPrice ? currentMinPrice : '';
        priceMaxInput.value = currentMaxPrice !== maxPrice ? currentMaxPrice : '';
    }
    
    // Обработчики для ползунков
    function setupDrag(thumb, isMin) {
        thumb.onmousedown = function(e) {
            e.preventDefault();
            
            document.onmousemove = function(e) {
                const sliderRect = document.querySelector('.price-slider').getBoundingClientRect();
                let percent = (e.clientX - sliderRect.left) / sliderRect.width;
                percent = Math.max(0, Math.min(1, percent));
                
                const price = Math.round(minPrice + percent * (maxPrice - minPrice));
                
                if (isMin) {
                    if (price < currentMaxPrice) {
                        currentMinPrice = price;
                    }
                } else {
                    if (price > currentMinPrice) {
                        currentMaxPrice = price;
                    }
                }
                
                updateSlider();
            };
            
            document.onmouseup = function() {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
    }
    
    setupDrag(priceThumbMin, true);
    setupDrag(priceThumbMax, false);
    
    // Обработчики для полей ввода
    priceMinInput.addEventListener('input', function() {
        const value = parseInt(this.value) || minPrice;
        if (value >= minPrice && value <= currentMaxPrice) {
            currentMinPrice = value;
            updateSlider();
        }
    });
    
    priceMaxInput.addEventListener('input', function() {
        const value = parseInt(this.value) || maxPrice;
        if (value <= maxPrice && value >= currentMinPrice) {
            currentMaxPrice = value;
            updateSlider();
        }
    });
    
    // Кнопка применения фильтра
    applyBtn.addEventListener('click', function() {
        applyFiltersAndSorting();
    });
    
    updateSlider();
}

function createProductCard(product) {
  const card = document.createElement("a");
  card.className = "product-card";
  card.dataset.id = product._id;

  card.innerHTML = `
    <img src="${product.photo}" alt="${product.name}">
    <h3>${product.name}</h3>
    <p>${product.brand}</p>
    <p>Цена: ${product.price.toFixed(2)} руб.</p>
    <p>Цвет: ${product.color}</p>
    <button class="product-card__button btn btn--theme-primary">Добавить в корзину</button>
  `;
  card.addEventListener("click", (e) => {
    if (!e.target.classList.contains("product-card__button")) {
      localStorage.setItem("selectedProduct", JSON.stringify(product));
      window.location.href = "product.html";
    }
  });

  card.querySelector(".product-card__button").addEventListener("click", () => addToCart(product));
  return card;
}

function displayProducts(products) {
  const catalog = document.getElementById("catalog");
  if (!catalog) return;

  catalog.innerHTML = "";
  const sortedProducts = sortProducts(products, currentSort);
  
  // Фильтрация по цене
  const filteredProducts = sortedProducts.filter(product => 
      product.price >= currentMinPrice && product.price <= currentMaxPrice
  );

  if (filteredProducts.length === 0) {
      catalog.innerHTML = "<p class='products__not'>Товары не найдены.</p>";
  } else {
      filteredProducts.forEach(product => catalog.appendChild(createProductCard(product)));
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
      const matchSearch = product.name.toLowerCase().includes(term) || 
                        product.brand.toLowerCase().includes(term);
      const matchPrice = product.price >= currentMinPrice && product.price <= currentMaxPrice;
      return matchBrand && matchSearch && matchPrice;
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


function handleSubscription(e) {
  e.preventDefault();
  
  const emailInput = document.querySelector('.subscribe-form__input');
  const email = emailInput.value.trim();
  const successMessage = document.querySelector('.success-message');
  
  if (!email || !email.includes('@') || !email.includes('.')) {
      alert('Пожалуйста, введите корректный email адрес');
      return;
  }
  
  showSuccessMessage();

  emailInput.value = '';
  
  function showSuccessMessage() {
      if (successMessage) {
          successMessage.style.display = 'block';
          setTimeout(() => {
              successMessage.style.display = 'none';
          }, 3000);
      } else {
          alert('Вы успешно подписались на рассылку!');
      }
  }
}


document.querySelector('.subscribe-form')?.addEventListener('submit', handleSubscription);