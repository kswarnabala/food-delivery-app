import { Router, Request, Response } from 'express';
import { getPool } from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();
const pool = getPool();

// Create order
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { items, deliveryDate, deliveryTime, customerDetails } = req.body;
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
    const orderQuery = 'INSERT INTO orders (user_id, total_amount, delivery_date, delivery_time, status, customer_name, customer_phone, customer_address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    const orderResult = await pool.query(orderQuery, [
      userId,
      total,
      deliveryDate,
      deliveryTime || null,
      'pending',
      customerDetails.name,
      customerDetails.phone,
      customerDetails.address
    ]);

    const orderId = orderResult.lastID;

    // Add order items
    for (const item of itemDetails) {
      await pool.query(
        'INSERT INTO order_items (order_id, food_id, quantity) VALUES ($1, $2, $3)',
        [orderId, item.foodId, item.quantity]
      );
    }

    res.json({ orderId, total, status: 'pending' });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get orders for current user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user?.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: get all customer orders
router.get('/admin/all', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all orders' });
  }
});

// Get order details
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user?.id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsResult = await pool.query(
      'SELECT oi.*, f.name, f.price FROM order_items oi JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = $1',
      [req.params.id]
    );

    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (Admin only)
router.put('/:id/status', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'waiting', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { id } = req.params;

    // Fetch the specific user_id of the order before updating
    const orderCheck = await pool.query('SELECT user_id FROM orders WHERE id = $1', [id]);
    if (!orderCheck.rows || orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const customerId = orderCheck.rows[0].user_id;

    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, id]
    );

    // Provide seamless Chatbot Notification!
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    const automatedMessage = `🔔 Order Update: Your Order #${id} has been ${capitalizedStatus}.`;

    await pool.query(
      'INSERT INTO chat_messages (user_id, is_admin, message) VALUES ($1, $2, $3)',
      [customerId, true, automatedMessage]
    );

    res.json({ success: true, message: 'Status updated and customer notified' });
  } catch (error) {
    console.error('Failed to update order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
