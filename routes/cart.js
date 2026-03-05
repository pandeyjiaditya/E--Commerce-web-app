const express = require('express');
const db = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

// GET /api/cart — get user's cart items with product details
router.get('/', (req, res) => {
    try {
        const items = db.prepare(`
      SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(req.user.id);

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.json({ items, total: parseFloat(total.toFixed(2)), count: items.length });
    } catch (err) {
        console.error('Cart fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch cart.' });
    }
});

// POST /api/cart — add item to cart (or update quantity if exists)
router.post('/', (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'Product ID is required.' });
        }

        // Check product exists and has stock
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock.' });
        }

        // Check if already in cart
        const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);

        if (existing) {
            db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
        } else {
            db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, quantity);
        }

        res.status(201).json({ message: 'Item added to cart.' });
    } catch (err) {
        console.error('Cart add error:', err);
        res.status(500).json({ error: 'Failed to add item to cart.' });
    }
});

// PUT /api/cart/:id — update item quantity
router.put('/:id', (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1.' });
        }

        // Verify ownership
        const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!item) {
            return res.status(404).json({ error: 'Cart item not found.' });
        }

        // Check stock
        const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock.' });
        }

        db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);

        res.json({ message: 'Cart updated.' });
    } catch (err) {
        console.error('Cart update error:', err);
        res.status(500).json({ error: 'Failed to update cart.' });
    }
});

// DELETE /api/cart/:id — remove item from cart
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Cart item not found.' });
        }

        res.json({ message: 'Item removed from cart.' });
    } catch (err) {
        console.error('Cart delete error:', err);
        res.status(500).json({ error: 'Failed to remove item from cart.' });
    }
});

module.exports = router;
