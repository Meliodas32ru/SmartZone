document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm = document.getElementById('checkout-form');
    const orderItemsContainer = document.getElementById('order-items');
    const orderTotalElement = document.getElementById('order-total');
    const accountPrompt = document.querySelector('.account-prompt'); // Блок с предложением входа

    // Проверяем авторизацию пользователя
    const token = localStorage.getItem('token');
    if (token) {
        // Если пользователь авторизован - скрываем блок
        if (accountPrompt) {
            accountPrompt.style.display = 'none';
        }
        
        // Загружаем данные пользователя для автозаполнения
        loadUserData();
    }

    // Получаем корзину из localStorage
    const cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    
    // Отображаем товары в заказе
    function renderOrderItems() {
        orderItemsContainer.innerHTML = '';
        let total = 0;
        
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.innerHTML = `
                <div class="order-item__name">${item.name} (${item.color})</div>
                <div class="order-item__quantity">${item.quantity || 1} шт.</div>
                <div class="order-item__price">${(item.price * (item.quantity || 1)).toLocaleString()} ₽</div>
            `;
            orderItemsContainer.appendChild(itemElement);
            total += item.price * (item.quantity || 1);
        });
        
        orderTotalElement.textContent = total.toLocaleString();
    }

    // Загрузка данных пользователя
    async function loadUserData() {
        try {
            const response = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                // Автозаполнение формы данными пользователя
                if (userData.name) document.getElementById('name').value = userData.name;
                if (userData.email) document.getElementById('email').value = userData.email;
            }
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
        }
    }

    // Обработка отправки формы
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(checkoutForm);
        const orderData = {
            customer: {
                name: formData.get('name'),
                email: formData.get('email'),
                address: formData.get('address')
            },
            paymentMethod: formData.get('paymentMethod'),
            items: cart,
            total: cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
        };
        
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            
            // Если пользователь авторизован, добавляем токен
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error('Ошибка при оформлении заказа');
            }

            const data = await response.json();
            
            // Перенаправляем на страницу оплаты
            window.location.href = data.paymentUrl;

            // Очищаем корзину после успешного оформления
            localStorage.removeItem('cart');
            localStorage.removeItem('checkoutCart');
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте снова.');
        }
    });
    
    // Инициализация
    renderOrderItems();
});