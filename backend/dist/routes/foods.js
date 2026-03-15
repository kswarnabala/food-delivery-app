"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const pool = (0, database_1.getPool)();
// Get all foods
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM foods WHERE available = true';
        const params = [];
        if (category) {
            query += ' AND category = $1';
            params.push(category);
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch foods' });
    }
});
// Admin: Add Food
router.post('/', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { name, category, description, price, image_url } = req.body;
        await pool.query('INSERT INTO foods (name, category, description, price, image_url, available) VALUES ($1, $2, $3, $4, $5, $6)', [name, category, description, price, image_url, true]);
        res.status(201).json({ message: 'Food added successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add food' });
    }
});
// Admin: Delete Food (Set available to false)
router.delete('/:id', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        await pool.query('UPDATE foods SET available = false WHERE id = $1', [req.params.id]);
        res.json({ message: 'Food removed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to remove food' });
    }
});
// Get food by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM foods WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Food not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch food' });
    }
});
exports.default = router;
