document.addEventListener('DOMContentLoaded', async () => {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Элементы страницы
    const profileForm = document.getElementById('profile-form');
    const ordersList = document.getElementById('orders-list');
    const logoutBtn = document.querySelector('.logout-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Загрузка данных пользователя
    try {
        const userRes = await fetch('/api/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!userRes.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        const user = await userRes.json();
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-email').value = user.email || '';
    } catch (error) {
        showMessage('Ошибка загрузки профиля', 'error');
    }
    
    // Загрузка заказов
    loadOrders();
    
    // Обработчики вкладок
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
            
            if (btn.dataset.tab === 'orders') {
                loadOrders();
            }
        });
    });
    
    // Обновление профиля
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('profile-name').value,
            password: document.getElementById('profile-password').value || undefined
        };
        
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            
            if (res.ok) {
                showMessage('Профиль успешно обновлен', 'success');
                document.getElementById('profile-password').value = '';
            } else {
                showMessage(data.error || 'Ошибка обновления', 'error');
            }
        } catch (error) {
            showMessage('Ошибка соединения', 'error');
        }
    });
    
    // Выход
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
    
    // Функция загрузки заказов
    async function loadOrders() {
        try {
            ordersList.innerHTML = '<p class="loading">Загрузка заказов...</p>';
            
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
    
            const res = await fetch('/api/user/orders', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!res.ok) {
                throw new Error('Ошибка загрузки заказов');
            }
            
            const orders = await res.json();
            
            if (orders.length === 0) {
                ordersList.innerHTML = '<p>У вас пока нет заказов</p>';
                return;
            }
            
            ordersList.innerHTML = '';
            
            orders.forEach(order => {
                const orderEl = document.createElement('div');
                orderEl.className = 'order-card';
                
                orderEl.innerHTML = `
                    <div class="order-header">
                        <div>
                            <strong>Заказ #${order.orderId}</strong>
                            <p>${new Date(order.date).toLocaleString()}</p>
                        </div>
                        <div>
                            <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
                            <p>${order.paymentMethod ? getPaymentMethodName(order.paymentMethod) : 'Способ оплаты не указан'}</p>
                        </div>
                    </div>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <img src="${item.photo}" alt="${item.name}">
                                <div class="order-item-info">
                                    <p>${item.name} (${item.color})</p>
                                    <p>${item.quantity} × ${item.price.toLocaleString()} ₽</p>
                                </div>
                                <div>${(item.price * item.quantity).toLocaleString()} ₽</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-total">
                        Итого: ${order.total.toLocaleString()} ₽
                    </div>
                    <div class="order-address">
                        <p><strong>Адрес доставки:</strong> ${order.customer.address}</p>
                    </div>
                `;
                
                ordersList.appendChild(orderEl);
            });
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            ordersList.innerHTML = '<p class="error-message">Ошибка загрузки заказов. Пожалуйста, попробуйте позже.</p>';
        }
    }
    
    // Вспомогательные функции
    function getStatusText(status) {
        const statuses = {
            'pending': 'Ожидает оплаты',
            'paid': 'Оплачен',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status] || status;
    }
    
    function getPaymentMethodName(method) {
        const methods = {
            'card': 'Банковская карта',
            'sbp': 'Система быстрых платежей',
            'qiwi': 'QIWI Кошелек'
        };
        return methods[method] || method;
    }
    
    function showMessage(text, type) {
        const messageEl = document.getElementById('profile-message');
        messageEl.textContent = text;
        messageEl.className = `form-message ${type}-message`;
        
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'form-message';
        }, 5000);
    }
});

