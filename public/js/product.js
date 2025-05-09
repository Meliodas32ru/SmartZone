document.addEventListener("DOMContentLoaded", () => {
    const product = JSON.parse(localStorage.getItem("selectedProduct"));
    const container = document.getElementById("product-details");
    if (!product) {
        container.innerHTML = "<p>Товар не найден.</p>";
        return;
    }
    container.innerHTML = `
        <img src="${product.photo}" alt="${product.name}" class="product-detail__img">
        <div class="product-detail__info">
            <h1 class="product-detail__title">${product.name}</h1>
            <p><strong>Бренд:</strong> ${product.brand}</p>
            <p><strong>Цена:</strong> ${product.price.toFixed(2)} руб.</p>
            <p><strong>Цвет:</strong> ${product.color}</p>
            <button class="btn btn--theme-primary product-detail__btn" id="add-to-cart">Добавить в корзину</button>
        </div>
    `;

    document.getElementById("add-to-cart").addEventListener("click", () => {
        addToCart(product);
    });
});

  // Подключи сюда функцию addToCart, если она не подключена отдельно
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
    alert(`Товар "${product.name}" добавлен в корзину!`);
}

