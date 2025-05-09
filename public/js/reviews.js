document.addEventListener('DOMContentLoaded', function () {
    // Инициализация рейтинга
    const stars = document.querySelectorAll('.star'); // ✅ Обновлено: .star вместо .rating__star
    const ratingInput = document.getElementById('rating');
    let currentRating = 0;

    // Обработчики для звезд рейтинга
    if (stars.length > 0 && ratingInput) {
        stars.forEach(star => {
            // Клик по звезде
            star.addEventListener('click', function () {
                currentRating = parseInt(this.dataset.value);
                ratingInput.value = currentRating;
                updateStars();
            });
        });
    } else {
        console.warn("Звёзды рейтинга или поле ввода не найдены");
    }

    // Функция обновления состояния звезд
    function updateStars() {
        stars.forEach(star => {
            const starValue = parseInt(star.dataset.value);
            star.classList.toggle('active', starValue <= currentRating);
        });
    }


    // Загрузка отзывов при открытии страницы
    loadAndDisplayReviews();

    // Обработчик формы
    const form = document.getElementById('addReviewForm');
    if (form) {
        form.addEventListener('submit', submitReview);
    } else {
        console.warn("Форма добавления отзыва не найдена");
    }

    document.querySelector('.logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = 'index.html';
    });
});


// === Функция: загрузка отзывов с сервера ===
async function loadAndDisplayReviews() {
    try {
        const response = await fetch('http://localhost:3031/api/reviews');
        if (!response.ok) throw new Error('Ошибка загрузки отзывов');
        const reviews = await response.json();
        displayReviews(reviews);
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Ошибка загрузки отзывов. Пожалуйста, попробуйте позже.', 'error');
    }
}

// === Функция: отображение отзывов ===
function displayReviews(reviews) {
    const container = document.getElementById('reviews');
    if (!container) return;

    container.innerHTML = '';

    if (!reviews.length) {
        container.innerHTML = '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>';
        return;
    }

    reviews.forEach(review => {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'review';
        reviewEl.innerHTML = `
            <div class="review-header">
                <h3 class="review__name">${review.name}</h3>
                <div class="review__rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
            </div>
            <p class="review__comment">${review.comment}</p>
            <small class="review__date">${new Date(review.date).toLocaleDateString('ru-RU')}</small>
        `;
        container.appendChild(reviewEl);
    });
}

// === Функция: отправка отзыва ===
async function submitReview(e) {
    e.preventDefault();

    const form = e.target;
    const name = form.querySelector('#name').value.trim();
    const comment = form.querySelector('#comment').value.trim();
    const rating = parseInt(form.querySelector('#rating').value);

    // Валидация
    if (!name || !comment || !rating || rating < 1 || rating > 5) {
        showMessage('Пожалуйста, заполните все поля и выберите оценку', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3031/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                comment,
                rating,
                date: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка сервера');
        }

        // Сброс формы
        resetReviewForm();

        // Обновление списка отзывов
        await loadAndDisplayReviews();

        showMessage('Спасибо! Ваш отзыв успешно добавлен.', 'success');
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage(`Ошибка при отправке отзыва: ${error.message}`, 'error');
    }
}

// === Функция: сброс формы ===
function resetReviewForm() {
    const form = document.getElementById('addReviewForm');
    if (form) {
        form.reset();
    }

    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active', 'hover');
    });

    const ratingInput = document.getElementById('rating');
    if (ratingInput) {
        ratingInput.value = '0';
    }
}

// === Функция: показ сообщений ===
function showMessage(text, type) {
    let messageBox = document.getElementById('message-box');

    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'message-box';
        messageBox.className = 'message';
        document.body.appendChild(messageBox);
    }

    messageBox.className = `message ${type}`;
    messageBox.textContent = text;
    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}
