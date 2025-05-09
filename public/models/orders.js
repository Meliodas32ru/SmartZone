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
}, { versionKey: false });

const Order = mongoose.model('Order', orderSchema);