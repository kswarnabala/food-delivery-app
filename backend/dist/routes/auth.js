"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../config/auth");
const database_1 = require("../config/database");
const auth_2 = require("../middleware/auth");
const router = (0, express_1.Router)();
const pool = (0, database_1.getPool)();
// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone, role = 'customer' } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }
        // Check if user exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        await pool.query('INSERT INTO users (email, password, name, phone, role) VALUES ($1, $2, $3, $4, $5)', [email, hashedPassword, name, phone || null, role]);
        const result = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        const token = (0, auth_1.generateToken)({ id: user.id, email: user.email, role: user.role });
        res.json({ token, user });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = result.rows[0];
        const passwordMatch = await (0, auth_1.comparePassword)(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = (0, auth_1.generateToken)({ id: user.id, email: user.email, role: user.role });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// Get profile
router.get('/profile', auth_2.authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name, phone, role FROM users WHERE id = $1', [req.user?.id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
exports.default = router;
