const express = require('express');
const db = require('../db/connection');

const router = express.Router();

// GET /api/products — list all products with optional search & category filter
router.get('/', (req, res) => {
    try {
        const { search, category } = req.query;
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const products = db.prepare(query).all(...params);
        res.json(products);
    } catch (err) {
        console.error('Products list error:', err);
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
});

// GET /api/products/categories — list all categories
router.get('/categories', (req, res) => {
    try {
        const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
        res.json(categories.map(c => c.category));
    } catch (err) {
        console.error('Categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

// GET /api/products/:id — single product detail
router.get('/:id', (req, res) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json(product);
    } catch (err) {
        console.error('Product detail error:', err);
        res.status(500).json({ error: 'Failed to fetch product.' });
    }
});

module.exports = router;
