import { Router, Request, Response } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { getPool } from '../config/database';

const router = Router();
const pool = getPool();

// Customer and admin both can send messages. Admin sends with userId in body.
router.post('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let targetUserId = userId;
    if (req.user?.role === 'admin') {
      if (!targetUserId) {
        return res.status(400).json({ error: 'userId is required for admin messages' });
      }
    } else {
      targetUserId = req.user?.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    const result = await pool.query(
      'INSERT INTO chat_messages (user_id, is_admin, message) VALUES ($1, $2, $3)',
      [targetUserId, req.user?.role === 'admin', message]
    );

    // Time-based auto-reply logic for customer messages
    if (req.user?.role !== 'admin') {
      const now = new Date();
      const currentHour = now.getHours(); // 0-23
      const adminPhone = process.env.ADMIN_PHONE || '+91-9876543210';
      const isAdminAvailable = currentHour >= 9 && currentHour < 20; // 9 AM to 8 PM

      // Check if we should auto-reply (avoid spamming on every message)
      const lastAutoReply = await pool.query(
        `SELECT created_at FROM chat_messages WHERE user_id = $1 AND is_admin = $2 AND (message LIKE '%connect you with the admin%' OR message LIKE '%Admin is not available%') ORDER BY created_at DESC LIMIT 1`,
        [targetUserId, true]
      );

      let shouldAutoReply = true;
      if (lastAutoReply.rows && lastAutoReply.rows.length > 0) {
        const lastTime = new Date(lastAutoReply.rows[0].created_at).getTime();
        if (Date.now() - lastTime < 300000) { // Don't repeat within 5 minutes
          shouldAutoReply = false;
        }
      }

      if (shouldAutoReply) {
        if (isAdminAvailable) {
          // During admin hours: tell customer to wait
          const autoMessage = `Please wait, I will connect you with the admin. 🕐`;
          await pool.query(
            'INSERT INTO chat_messages (user_id, is_admin, message) VALUES ($1, $2, $3)',
            [targetUserId, true, autoMessage]
          );

          // Also insert a notification for the admin
          const customerName = req.user?.email || `Customer #${targetUserId}`;
          const notifMessage = `⚡ ${customerName} is waiting for your response.`;
          await pool.query(
            'INSERT INTO chat_messages (user_id, is_admin, message) VALUES ($1, $2, $3)',
            [targetUserId, true, notifMessage]
          );
        } else {
          // Outside admin hours: tell customer admin is unavailable
          const autoMessage = `Admin is not available right now. Our working hours are 09:00 AM to 08:00 PM. For urgent queries, you can contact: ${adminPhone}`;
          await pool.query(
            'INSERT INTO chat_messages (user_id, is_admin, message) VALUES ($1, $2, $3)',
            [targetUserId, true, autoMessage]
          );
        }
      }
    }

    res.status(201).json({ success: true, message: 'Message sent', data: { id: (result as any).lastID || null } });
  } catch (error) {
    console.error('Chat send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role === 'admin') {
      const userId = req.query.userId;
      if (userId) {
        const result = await pool.query('SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at', [userId]);
        return res.json(result.rows);
      }
      const result = await pool.query('SELECT * FROM chat_messages ORDER BY created_at');
      return res.json(result.rows);
    }

    const result = await pool.query('SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at', [req.user?.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Chat fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/availability', async (req: Request, res: Response) => {
  const now = new Date();
  const currentHour = now.getHours();
  const isAvailable = currentHour >= 9 && currentHour < 20;
  const availableTime = process.env.ADMIN_AVAILABLE_TIME || '09:00 AM to 08:00 PM';

  res.json({
    admin_available: isAvailable,
    message: isAvailable
      ? 'Admin is online. Send your message and we will connect you shortly.'
      : `Admin is currently offline. Working hours: ${availableTime}.`,
    hours: availableTime,
  });
});

// Edit a message
router.put('/messages/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Check ownership
    const msgCheck = await pool.query('SELECT user_id, is_admin FROM chat_messages WHERE id = $1', [id]);
    if (msgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const msg = msgCheck.rows[0];
    if ((isAdmin && !msg.is_admin) || (!isAdmin && (msg.is_admin || msg.user_id !== userId))) {
      return res.status(403).json({ error: 'Unauthorized to edit this message' });
    }

    await pool.query('UPDATE chat_messages SET message = $1 WHERE id = $2', [message, id]);
    res.json({ success: true, message: 'Message updated' });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete a message
router.delete('/messages/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    // Check ownership
    const msgCheck = await pool.query('SELECT user_id, is_admin FROM chat_messages WHERE id = $1', [id]);
    if (msgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const msg = msgCheck.rows[0];
    if (!isAdmin && (msg.is_admin || msg.user_id !== userId)) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    await pool.query('DELETE FROM chat_messages WHERE id = $1', [id]);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
