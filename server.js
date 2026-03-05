const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security Middleware ───
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.paypal.com", "https://www.sandbox.paypal.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://www.paypalobjects.com"],
            connectSrc: ["'self'", "https://www.sandbox.paypal.com"],
            frameSrc: ["'self'", "https://www.sandbox.paypal.com"]
        }
    }
}));
app.use(cors());

// ─── Body Parsing ───
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ───
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ───
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// ─── PayPal Client ID endpoint ───
app.get('/api/config/paypal', (req, res) => {
    res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
});

// ─── SPA fallback — serve index.html for non-API routes ───
app.get('/{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// ─── Start Server ───
app.listen(PORT, () => {
    console.log(`\n🚀 E-Commerce server running at http://localhost:${PORT}`);
    console.log(`📦 API available at http://localhost:${PORT}/api`);
    console.log(`\n💡 Run "node db/seed.js" to setup the database\n`);
});
