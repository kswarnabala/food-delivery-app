"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const pool = (0, database_1.getPool)();
// Create order
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { items, deliveryDate, customerDetails } = req.body;
        const userId = req.user?.id;
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must have items' });
        }
        // Calculate total
        let total = 0;
        const itemDetails = [];
        for (const item of items) {
            const foodResult = await pool.query('SELECT price FROM foods WHERE id = $1', [item.foodId]);
            if (foodResult.rows.length === 0) {
                return res.status(400).json({ error: `Food ${item.foodId} not found` });
            }
            const price = foodResult.rows[0].price;
            total += price * item.quantity;
            itemDetails.push({ foodId: item.foodId, quantity: item.quantity });
        }
        // Insert order (SQLite compatible: remove RETURNING)
        const orderQuery = 'INSERT INTO orders (user_id, total_amount, delivery_date, status, customer_name, customer_phone, customer_address) VALUES ($1, $2, $3, $4, $5, $6, $7)';
        const orderResult = await pool.query(orderQuery, [
            userId,
            total,
            deliveryDate,
            'pending',
            customerDetails.name,
            customerDetails.phone,
            customerDetails.address
        ]);
        const orderId = orderResult.lastID;
        // Add order items
        for (const item of itemDetails) {
            await pool.query('INSERT INTO order_items (order_id, food_id, quantity) VALUES ($1, $2, $3)', [orderId, item.foodId, item.quantity]);
        }
        res.json({ orderId, total, status: 'pending' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create order' });
    }
});
// Get user orders
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user?.id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
// Get order details
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user?.id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const itemsResult = await pool.query('SELECT oi.*, f.name, f.price FROM order_items oi JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = $1', [req.params.id]);
        res.json({ order: orderResult.rows[0], items: itemsResult.rows });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});
exports.default = router;
