document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Предотвращаем отправку формы

    // Получаем значения из формы
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Проверка данных (здесь можно добавить запрос к серверу)
    if (username === "admin" && password === "12345") {
        alert("Вход выполнен успешно!");
        window.location.href = "catalog.html"; // Перенаправление на страницу каталога
    } else {
        alert("Неверный логин или пароль!");
    }
});