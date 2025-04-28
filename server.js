const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3059;

mongoose.connect('mongodb://localhost:27017/SmartZone', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    color: { type: String, required: true },
    photo: { type: String, required: true }
});

const Product = mongoose.model('Product', productSchema);

const reviewSchema = new mongoose.Schema({
    name: String,
    comment: String,
    rating: Number,
    date: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', reviewSchema);

app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ date: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при загрузке отзывов' });
    }
});

app.use(express.json());

let orders = [];

app.post('/api/orders', (req, res) => {
    const order = req.body;

    if (!order) {
        return res.status(400).json({ error: 'Тело запроса пустое' });
    }

    order.orderId = Date.now().toString();
    orders.push(order);
    console.log('Новый заказ:', order);
    res.status(201).json({ orderId: order.orderId });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/reviews', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reviews.html'));
});

app.get('/catalog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'catalog.html'));
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
