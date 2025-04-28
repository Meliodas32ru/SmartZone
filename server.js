const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3059;

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/SmartZone', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Создание схемы продукта
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    color: { type: String, required: true },
    photo: { type: String, required: true }
});

// Создание модели продукта
const Product = mongoose.model('Product', productSchema);

const reviewSchema = new mongoose.Schema({
    name: String,
    comment: String,
    rating: Number,
    date: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', reviewSchema);

// API для получения отзывов
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ date: -1 }); // Сортировка по дате (новые сначала)
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при загрузке отзывов' });
    }
});


app.use(express.json());

// Массив для хранения заказов
let orders = [];

// API для создания заказа
app.post('/api/orders', (req, res) => {
    const order = req.body;

    if (!order) {
        return res.status(400).json({ error: 'Тело запроса пустое' });
    }

    // Генерация уникального ID заказа
    order.orderId = Date.now().toString();

    // Сохранение заказа
    orders.push(order);

    console.log('Новый заказ:', order);

    // Ответ клиенту
    res.status(201).json({ orderId: order.orderId });
});
// Middleware для обработки JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Маршрут для страницы каталога
app.get('/reviews', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reviews.html'));
});
// Маршрут для страницы каталога
app.get('/catalog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'catalog.html'));
});
// Маршрут для получения товаров из базы данных
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find(); // Получение всех товаров из базы данных
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
