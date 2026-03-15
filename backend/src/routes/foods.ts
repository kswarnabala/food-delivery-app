import { Router, Request, Response } from 'express';
import { getPool } from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();
const pool = getPool();

// Get all foods
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM foods WHERE available = true';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch foods' });
  }
});

// Admin: Add Food
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, category, description, price, image_url } = req.body;
    await pool.query(
      'INSERT INTO foods (name, category, description, price, image_url, available) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, description, price, image_url, true]
    );
    res.status(201).json({ message: 'Food added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add food' });
  }
});

// Admin: Update Food
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, category, description, price, image_url } = req.body;
    console.log(`UPDATING FOOD ID: ${req.params.id}`);

    await pool.query(
      'UPDATE foods SET name = ?, category = ?, description = ?, price = ?, image_url = ? WHERE id = ?',
      [name, category, description, price, image_url, req.params.id]
    );
    res.json({ message: 'Food updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update food' });
  }
});

// Admin: Delete Food (Set available to false)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    await pool.query('UPDATE foods SET available = false WHERE id = ?', [req.params.id]);
    res.json({ message: 'Food removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove food' });
  }
});

// Get food by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM foods WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Food not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch food' });
  }
});

export default router;
