document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');
    
    document.getElementById('order-id').textContent = orderId;
    document.getElementById('payment-amount').textContent = parseFloat(amount).toLocaleString();
    
    // Обработка выбора метода оплаты
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
            updatePaymentForm(method.dataset.method);
        });
    });
    
    // Обновление формы оплаты в зависимости от метода
    function updatePaymentForm(method) {
        const paymentForm = document.getElementById('payment-form');
        
        switch(method) {
            case 'card':
                paymentForm.innerHTML = `
                    <div class="card-form">
                        <input type="text" placeholder="Номер карты" class="card-input">
                        <input type="text" placeholder="Срок действия" class="card-input">
                        <input type="text" placeholder="CVV" class="card-input">
                        <input type="text" placeholder="Имя владельца" class="card-input">
                    </div>
                `;
                break;
            case 'sbp':
                paymentForm.innerHTML = `
                    <div class="sbp-form">
                        <p>После нажатия "Оплатить сейчас" вы будете перенаправлены в ваше банковское приложение</p>
                    </div>
                `;
                break;
            case 'qiwi':
                paymentForm.innerHTML = `
                    <div class="qiwi-form">
                        <input type="text" placeholder="Номер QIWI кошелька" class="qiwi-input">
                    </div>
                `;
                break;
        }
    }
    
    // Обработка оплаты
    document.getElementById('pay-now-btn').addEventListener('click', async () => {
        const selectedMethod = document.querySelector('.payment-method.selected').dataset.method;
        
        try {
            // В реальном приложении здесь должна быть интеграция с платежной системой
            // Для демонстрации просто имитируем успешную оплату
            const response = await fetch('/api/payment/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    amount,
                    paymentMethod: selectedMethod
                }),
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при обработке платежа');
            }
            
            const result = await response.json();
            
            if (result.success) {
                alert('Оплата прошла успешно! Спасибо за ваш заказ.');
                window.location.href = '/';
            } else {
                alert('При оплате возникла ошибка: ' + (result.message || 'Попробуйте еще раз'));
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при обработке платежа. Пожалуйста, попробуйте снова.');
        }
    });
    
    
});