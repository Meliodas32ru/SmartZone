let allProducts = [];
let currentSort = "default";



async function loadProducts() {
    try {
        const response = await fetch("/api/products");
        allProducts = await response.json();
        console.log("Товары загружены:", allProducts); // Отладка

        const catalog = document.getElementById("catalog");
        catalog.innerHTML = "";

        allProducts.forEach(product => {
            const productCard = createProductCard(product);
            catalog.appendChild(productCard);
        });

        // Инициализация поиска
        const searchInput = document.getElementById("search-input");
        searchInput.addEventListener("input", filterProducts);


        // Инициализация сортировки
        document.querySelectorAll('.sort-btn').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const sortType = button.dataset.sort;
                currentSort = sortType;
                applyFiltersAndSorting(); // Применяем фильтры и сортировку
            });
        });

        // Активируем кнопку сортировки по умолчанию
        document.querySelector('.sort-btn[data-sort="default"]').classList.add('active');
    } catch (error) {
        console.error("Ошибка при загрузке товаров:", error);
    }
}

function filterByBrand(brand) {
    const catalog = document.getElementById("catalog");
    if (!catalog) {
        console.error("Элемент каталога не найден!");
        return;
    }

    const filteredProducts = brand === "all"
        ? allProducts
        : allProducts.filter(product => product.brand === brand);

    console.log("Отфильтрованные товары:", filteredProducts); // Отладка

    // Отображаем отфильтрованные товары
    displayProducts(filteredProducts);

    // Активируем соответствующую кнопку фильтрации
    activateBrandFilter(brand);
}
document.addEventListener("DOMContentLoaded", () => {
    const selectedBrand = localStorage.getItem('selectedBrand'); // Получаем бренд из localStorage
    console.log("Бренд из localStorage:", selectedBrand); // Отладочный вывод

    loadProducts().then(() => {
        if (selectedBrand) {
            filterByBrand(selectedBrand); // Фильтруем товары по бренду
            activateBrandFilter(selectedBrand); // Активируем соответствующую кнопку
            localStorage.removeItem('selectedBrand'); // Очищаем выбранный бренд
        } else {
            displayProducts(allProducts); // Если бренд не выбран, показываем все товары
            activateBrandFilter("all"); // Активируем кнопку "Все"
        }
    });
});

function activateBrandFilter(brand) {
    document.querySelectorAll('.brand-filter').forEach(button => {
        button.classList.remove('active'); // Убираем active у всех кнопок
        if (button.dataset.brand === brand) {
            button.classList.add('active'); // Добавляем active к выбранной кнопке
        }
    });
}

function createProductCard(product) {
    const productCard = document.createElement("div");
    productCard.className = "product-card";

    productCard.innerHTML = `
        <img src="${product.photo}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <p>Цена: ${product.price.toFixed(2)} руб.</p>
        <p>Цвет: ${product.color}</p>
        <button data-id="${product._id}">Добавить в корзину</button>
    `;

    const addToCartButton = productCard.querySelector("button");
    addToCartButton.addEventListener("click", () => addToCart(product));

    return productCard;
}

function sortProducts(products, sortType) {
    if (sortType === "asc") {
        return products.slice().sort((a, b) => a.price - b.price);
    } else if (sortType === "desc") {
        return products.slice().sort((a, b) => b.price - a.price);
    }
    return products;
}

function displayProducts(filteredProducts) {
    const catalog = document.getElementById("catalog");
    if (!catalog) {
        console.error("Элемент каталога не найден!");
        return;
    }

    catalog.innerHTML = ""; // Очистка каталога

    const sortedProducts = sortProducts(filteredProducts, currentSort);

    if (sortedProducts.length === 0) {
        catalog.innerHTML = "<p>Товары не найдены.</p>"; // Сообщение, если товаров нет
    } else {
        sortedProducts.forEach(product => {
            const productCard = createProductCard(product);
            catalog.appendChild(productCard);
        });
    }
}
document.querySelectorAll('.brand-filter').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.brand-filter').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const brand = button.dataset.brand;
        filterByBrand(brand); // Фильтруем товары по выбранному бренду
    });
});
function applyFiltersAndSorting() {
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    const activeBrandButton = document.querySelector('.brand-filter.active');
    const selectedBrand = activeBrandButton ? activeBrandButton.dataset.brand : "all"; // Если кнопка не выбрана, показываем все товары

    const filteredProducts = allProducts.filter(product => {
        const matchesBrand = selectedBrand === "all" || product.brand === selectedBrand;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.brand.toLowerCase().includes(searchTerm);
        return matchesBrand && matchesSearch;
    });

    displayProducts(filteredProducts);
}
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingItem = cart.find(item => item.id === product._id);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            id: product._id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            color: product.color,
            photo: product.photo,
            quantity: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    alert(`${product.name} добавлен в корзину!`);
}


// Обновление счетчика корзины
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.setAttribute('data-count', count);
        cartCount.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function filterProducts() {
    applyFiltersAndSorting();
}
window.onload = () => {
    loadProducts();
    updateCartCount();
};

// Инициализация счетчика при загрузке
document.addEventListener('DOMContentLoaded', updateCartCount);