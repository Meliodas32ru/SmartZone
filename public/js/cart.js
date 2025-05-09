document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.querySelector('.cart__items-container');
    const totalAmountElement = document.getElementById('total-amount');
    const clearCartBtn = document.querySelector('.cart__clear-btn');
    const checkoutBtn = document.querySelector('.cart__checkout-btn');

    // Инициализация корзины
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Функция отрисовки корзины
    function renderCart() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.photo}" alt="${item.name}" class="cart-item__img">
                <div class="cart-item__details">
                    <h4 class="cart-item__name">${item.name}</h4>
                    <p class="cart-item__color">Цвет: ${item.color}</p>
                    <p class="cart-item__price">Цена: ${item.price.toLocaleString()} ₽</p>
                    <div class="quantity-control">
                        <button class="cart-quantity-btn minus" data-index="${index}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity || 1}" min="1">
                        <button class="cart-quantity-btn plus" data-index="${index}">+</button>
                    </div>
                </div>
                <button class="cart-item__remove" data-index="${index}">×</button>
            `;
            cartItemsContainer.appendChild(cartItem);

            total += item.price * (item.quantity || 1);
        });

        totalAmountElement.textContent = total.toLocaleString();
        updateCartCount();
    }

    // Обновление счетчика корзины
    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const cartCount = document.querySelector('.cart-count');

        if (cartCount) {
            cartCount.setAttribute('data-count', count);
            cartCount.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    // Обработчик изменения количества
    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('cart-quantity-btn')) {
            const index = e.target.dataset.index;
            const isPlus = e.target.classList.contains('plus');
            
            if (isPlus) {
                cart[index].quantity = (cart[index].quantity || 1) + 1;
            } else {
                cart[index].quantity = Math.max(1, (cart[index].quantity || 1) - 1);
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
        }
    });

    // Удаление товара
    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('cart-item__remove')) {
            const index = e.target.dataset.index;
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
        }
    });

    // Очистка корзины
    clearCartBtn.addEventListener('click', () => {
        cart = [];
        localStorage.removeItem('cart');
        renderCart();
    });

    // Оформление заказа - перенаправление на страницу оформления
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Ваша корзина пуста!');
            return;
        }
        
        // Сохраняем корзину в localStorage перед переходом
        localStorage.setItem('checkoutCart', JSON.stringify(cart));
        window.location.href = '/checkout.html';
    });

    document.querySelector('.logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = 'index.html';
    });
    // Инициализация при загрузке
    renderCart();

});
