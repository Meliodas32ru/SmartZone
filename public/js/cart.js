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
                    <div class="cart-item__quantity-control">
                        <button class="quantity-btn minus" data-index="${index}">−</button>
                        <span class="quantity">${item.quantity || 1}</span>
                        <button class="quantity-btn plus" data-index="${index}">+</button>
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
        if (e.target.classList.contains('quantity-btn')) {
            const index = e.target.dataset.index;
            const action = e.target.classList.contains('plus') ? 'plus' : 'minus';

            if (action === 'plus') {
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

    // Оформление заказа
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Ваша корзина пуста!');
            return;
        }

        // Сбор данных пользователя
        const name = prompt('Введите ваше имя:');
        const email = prompt('Введите ваш email:');
        const address = prompt('Введите адрес доставки:');

        if (!name || !email || !address) {
            alert('Пожалуйста, заполните все поля!');
            return;
        }

        // Создание заказа
        const order = {
            customer: { name, email, address },
            items: cart,
            total: cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
            date: new Date().toISOString()
        };

        fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Убедитесь, что заголовок установлен
            },
            body: JSON.stringify(order), // order должен быть объектом
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при оформлении заказа');
                }
                return response.json();
            })
            .then(data => {
                alert('Заказ успешно оформлен! Номер вашего заказа: ' + data.orderId);
                // Очистка корзины после успешного оформления
                cart = [];
                localStorage.removeItem('cart');
                renderCart();
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте снова.');
            });
    });

    // Инициализация при загрузке
    renderCart();
});
