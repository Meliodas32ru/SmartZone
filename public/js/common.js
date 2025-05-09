document.addEventListener('DOMContentLoaded', () => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    const loginLink = document.querySelector('a[href="login.html"]');
    const userLink = document.querySelector('a[href="user.html"]');
    
    if (token) {
        // Если пользователь авторизован
        if (loginLink) {
            loginLink.textContent = 'Личный кабинет';
            loginLink.href = 'user.html';
        }
        
        // Добавляем кнопку выхода
        if (!document.querySelector('.logout-btn')) {
            const nav = document.querySelector('.nav__list');
            if (nav) {
                const logoutItem = document.createElement('li');
                logoutItem.className = 'nav__item';
                logoutItem.innerHTML = '<button class="logout-btn">Выйти</button>';
                nav.appendChild(logoutItem);
                
                // Обработчик выхода
                logoutItem.querySelector('.logout-btn').addEventListener('click', () => {
                    localStorage.removeItem('token');
                    window.location.reload();
                });
            }
        }
    } else {
        // Если не авторизован
        if (userLink) {
            userLink.textContent = 'Вход';
            userLink.href = 'login.html';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('.logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = 'index.html';
    });
});