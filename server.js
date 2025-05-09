const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3031;
const JWT_SECRET = 'super_secret_key';

// Асинхронное подключение к MongoDB
async function connectToDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/SmartZone');
        console.log('Успешное подключение к MongoDB');
    } catch (error) {
        console.error('Ошибка подключения к MongoDB:', error);
        process.exit(1);
    }
}

// Инициализация подключения
connectToDatabase();

// Обработчик событий подключения
mongoose.connection.on('connected', () => {
    console.log('Mongoose подключен к базе данных');
});

mongoose.connection.on('error', (err) => {
    console.error('Ошибка подключения Mongoose:', err);
});

// Настройка почтового сервиса
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'v321822@gmail.com',
        pass: process.env.EMAIL_PASS || 'vvhs gtuf epjx zekc'
    }
});

// Схемы
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    color: { type: String, required: true },
    photo: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    name: String,
    role: { type: String, default: 'user' }
});

const reviewSchema = new mongoose.Schema({
    name: String,
    comment: String,
    rating: Number,
    date: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customer: {
        name: String,
        email: String,
        address: String
    },
    items: [{
        name: String,
        price: Number,
        quantity: Number,
        color: String,
        photo: String
    }],
    total: Number,
    status: { type: String, default: 'pending' },
    paymentMethod: String,
    date: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);
const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// Добавить после других middleware
app.use((req, res, next) => {
    // Пропускаем статические файлы и API-маршруты
    if (req.path.startsWith('/api') || req.path.startsWith('/css') || 
        req.path.startsWith('/js') || req.path.startsWith('/images')) {
        return next();
    }
    
    // Проверяем авторизацию только для HTML-страниц
    if (req.path.endsWith('.html') && !req.path.includes('login.html') && 
        !req.path.includes('register.html') && !req.path.includes('index.html')) {
        const token = req.headers.authorization?.split(' ')[1] || 
                    req.cookies?.token || 
                    localStorage.getItem('token');
        
        if (!token) {
            return res.redirect('/login.html');
        }
        
        try {
            jwt.verify(token, JWT_SECRET);
            next();
        } catch (err) {
            return res.redirect('/login.html');
        }
    } else {
        next();
    }
});
// JWT Middleware
function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Нет токена' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Неверный токен' });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещён' });
    }
    next();
}

// Маршруты страниц
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/reviews', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reviews.html')));
app.get('/catalog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'catalog.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));
app.get('/payment', (req, res) => res.sendFile(path.join(__dirname, 'public', 'payment.html')));

// API маршруты
app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Пользователь уже существует' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, name });
    await user.save();

    res.status(201).json({ message: 'Регистрация успешна' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role });
});

// Товары
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/products', auth, adminOnly, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/products/:id', auth, adminOnly, async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/products/:id', auth, adminOnly, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Удалено' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Отзывы
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ date: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при загрузке отзывов' });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { name, comment, rating } = req.body;
        
        if (!name || !comment || !rating) {
            return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Рейтинг должен быть от 1 до 5' });
        }
        
        const newReview = new Review({
            name,
            comment,
            rating,
            date: new Date()
        });
        
        await newReview.save();
        res.status(201).json(newReview);
    } catch (error) {
        console.error('Ошибка при сохранении отзыва:', error);
        res.status(500).json({ message: 'Ошибка при сохранении отзыва' });
    }
});

// Заказы
app.post('/api/orders', async (req, res) => {
    try {
        const order = req.body;
        if (!order) return res.status(400).json({ error: 'Тело запроса пустое' });

        // Генерируем номер заказа
        order.orderId = Date.now().toString();
        order.status = 'pending';
        order.date = new Date();
        
        // Сохраняем заказ в БД
        const newOrder = new Order(order);
        await newOrder.save();

        // Отправляем email подтверждения
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your.email@gmail.com',
            to: order.customer.email,
            subject: `SmartZone: Заказ №${order.orderId}`,
            html: `
                <h2>Спасибо за ваш заказ!</h2>
                <p>Номер заказа: ${order.orderId}</p>
                <p>Дата: ${new Date().toLocaleString()}</p>
                <p>Итого: ${order.total.toLocaleString()} ₽</p>
                <h3>Состав заказа:</h3>
                <ul>
                    ${order.items.map(item => `
                        <li>
                            ${item.name} - ${item.quantity} шт. × ${item.price.toLocaleString()} ₽ = 
                            ${(item.price * item.quantity).toLocaleString()} ₽
                        </li>
                    `).join('')}
                </ul>
                <h3>Данные доставки:</h3>
                <p>Имя: ${order.customer.name}</p>
                <p>Адрес: ${order.customer.address}</p>
                <p>Статус: Ожидает оплаты</p>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.status(201).json({ 
            orderId: order.orderId,
            paymentUrl: `/payment.html?orderId=${order.orderId}&amount=${order.total}`
        });
    } catch (error) {
        console.error('Ошибка при оформлении заказа:', error);
        res.status(500).json({ error: 'Ошибка при оформлении заказа' });
    }
});

// Получение информации о заказе
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }
        res.json(order);
    } catch (error) {
        console.error('Ошибка при получении заказа:', error);
        res.status(500).json({ error: 'Ошибка при получении заказа' });
    }
});

// Обработка платежа
app.post('/api/payment/process', async (req, res) => {
    try {
        const { orderId, paymentMethod } = req.body;
        
        // В реальном приложении здесь должна быть интеграция с платежной системой
        // Для демонстрации просто имитируем успешную оплату
        
        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Заказ не найден' });
        }
        
        // Обновляем статус заказа
        order.status = 'paid';
        order.paymentMethod = paymentMethod;
        await order.save();
        
        // Отправляем email об успешной оплате
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your.email@gmail.com',
            to: order.customer.email,
            subject: `SmartZone: Заказ №${order.orderId} оплачен`,
            html: `
                <h2>Ваш заказ успешно оплачен!</h2>
                <p>Номер заказа: ${order.orderId}</p>
                <p>Сумма оплаты: ${order.total.toLocaleString()} ₽</p>
                <p>Способ оплаты: ${getPaymentMethodName(paymentMethod)}</p>
                <p>Мы уже начали готовить ваш заказ к отправке.</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        
        res.json({ 
            success: true,
            orderId: order.orderId,
            amount: order.total,
            paymentMethod: paymentMethod
        });
    } catch (error) {
        console.error('Ошибка обработки платежа:', error);
        res.status(500).json({ success: false, error: 'Ошибка обработки платежа' });
    }
});

// Вспомогательные функции
function getPaymentMethodName(method) {
    const methods = {
        'card': 'Банковская карта',
        'sbp': 'Система быстрых платежей',
        'qiwi': 'QIWI Кошелек'
    };
    return methods[method] || method;
}

app.get('/api/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
    }
});

app.get('/user', (req, res) => res.sendFile(path.join(__dirname, 'public', 'user.html')));
app.get('/api/user/orders', auth, async (req, res) => {
    try {
        // Получаем email пользователя из токена
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Ищем заказы по email пользователя
        const orders = await Order.find({ 'customer.email': user.email }).sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        res.status(500).json({ error: 'Ошибка при получении заказов' });
    }
});

app.put('/api/user/profile', auth, async (req, res) => {
    try {
        const { name, password } = req.body;
        const update = { name };
        
        if (password) {
            update.password = await bcrypt.hash(password, 10);
        }
        
        const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true });
        res.json({ message: 'Профиль обновлен', user });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении профиля' });
    }
});
// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});