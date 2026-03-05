const express = require('express');
const db = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware);

// POST /api/orders — create order from cart + payment info
router.post('/', (req, res) => {
    try {
        const { payment_id, payment_status = 'completed', shipping_address = '' } = req.body;

        if (!payment_id) {
            return res.status(400).json({ error: 'Payment ID is required.' });
        }

        // Get cart items
        const cartItems = db.prepare(`
      SELECT ci.*, p.price, p.name, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(req.user.id);

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty.' });
        }

        // Verify stock
        for (const item of cartItems) {
            if (item.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for "${item.name}". Available: ${item.stock}`
                });
            }
        }

        // Calculate total
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Use a transaction
        const createOrder = db.transaction(() => {
            // Create order
            const orderResult = db.prepare(
                'INSERT INTO orders (user_id, total, payment_id, payment_status, shipping_address) VALUES (?, ?, ?, ?, ?)'
            ).run(req.user.id, parseFloat(total.toFixed(2)), payment_id, payment_status, shipping_address);

            const orderId = orderResult.lastInsertRowid;

            // Create order items and reduce stock
            for (const item of cartItems) {
                db.prepare(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
                ).run(orderId, item.product_id, item.quantity, item.price);

                db.prepare(
                    'UPDATE products SET stock = stock - ? WHERE id = ?'
                ).run(item.quantity, item.product_id);
            }

            // Clear cart
            db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

            return orderId;
        });

        const orderId = createOrder();

        res.status(201).json({
            message: 'Order placed successfully!',
            order: {
                id: orderId,
                total: parseFloat(total.toFixed(2)),
                payment_id,
                payment_status,
                items: cartItems.map(i => ({
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price
                }))
            }
        });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to create order.' });
    }
});

// GET /api/orders — get user's order history
router.get('/', (req, res) => {
    try {
        const orders = db.prepare(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
        ).all(req.user.id);

        // Fetch items for each order
        for (const order of orders) {
            order.items = db.prepare(`
        SELECT oi.*, p.name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `).all(order.id);
        }

        res.json(orders);
    } catch (err) {
        console.error('Order history error:', err);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});

module.exports = router;
