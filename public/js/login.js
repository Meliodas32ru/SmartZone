document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            document.cookie = `token=${data.token}; path=/; max-age=86400`; // 1 день
            if (data.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
        } else {
            document.getElementById('login-message').textContent = data.message || 'Ошибка входа';
        }
    } catch (error) {
        document.getElementById('login-message').textContent = 'Сервер недоступен';
    }
});