"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const qrcode_1 = __importDefault(require("qrcode"));
const router = (0, express_1.Router)();
const pool = (0, database_1.getPool)();
// Create payment
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        if (!orderId || !amount) {
            return res.status(400).json({ error: 'Order ID and amount are required' });
        }
        // Generate QR code
        const qrData = `ORDER_${orderId}_${Date.now()}`;
        const qrCode = await qrcode_1.default.toDataURL(qrData);
        // Create payment record (SQLite compatible: remove RETURNING)
        const query = 'INSERT INTO payments (order_id, amount, status, qr_code) VALUES ($1, $2, $3, $4)';
        const result = await pool.query(query, [orderId, amount, 'pending', qrCode]);
        // Fetch the inserted record for response
        const insertedId = result.lastID;
        const fetchResult = await pool.query('SELECT * FROM payments WHERE id = $1', [insertedId]);
        const payment = fetchResult.rows[0];
        res.json({ payment, qrCode });
    }
    catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});
// Update payment status
router.put('/:id/complete', auth_1.authMiddleware, async (req, res) => {
    try {
        // SQLite compatible update
        await pool.query('UPDATE payments SET status = $1 WHERE id = $2', ['completed', req.params.id]);
        const result = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        // Update order status
        const payment = result.rows[0];
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['confirmed', payment.order_id]);
        res.json({ payment: result.rows[0], message: 'Payment completed successfully' });
    }
    catch (error) {
        console.error('Payment update error:', error);
        res.status(500).json({ error: 'Failed to update payment' });
    }
});
// Get payment details
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment' });
    }
});
exports.default = router;
