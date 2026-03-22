import { Router, Request, Response } from 'express';
import { getPool } from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();
const pool = getPool();

// Get all foods
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT f.*, 
             ROUND(COALESCE(AVG(r.rating), 0), 1) as "avgRating",
             COUNT(r.rating) as "reviewCount"
      FROM foods f
      LEFT JOIN food_reviews r ON f.id = r.food_id
      WHERE f.available = true
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND f.category = ?';
      params.push(category);
    }

    query += ' GROUP BY f.id';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Foods GET error:', error);
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

// Add review for a food by customer
router.post('/:id/reviews', authMiddleware, async (req: Request, res: Response) => {
  try {
    const foodId = parseInt(req.params.id, 10);
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'Invalid user.' });
    }

    const foodCheck = await pool.query('SELECT * FROM foods WHERE id = ?', [foodId]);
    if (foodCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Food not found.' });
    }

    await pool.query('INSERT INTO food_reviews (food_id, user_id, rating, comment) VALUES (?, ?, ?, ?)', [foodId, userId, rating, comment || null]);
    res.status(201).json({ message: 'Review added successfully.' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Failed to add review.' });
  }
});

// Get reviews for a food item and average rating
router.get('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const foodId = parseInt(req.params.id, 10);
    const reviews = await pool.query('SELECT r.*, u.name as user_name FROM food_reviews r JOIN users u ON r.user_id = u.id WHERE r.food_id = ? ORDER BY r.created_at DESC', [foodId]);
    const stats = await pool.query('SELECT COUNT(*) as total, AVG(rating) as avgRating FROM food_reviews WHERE food_id = ?', [foodId]);

    const total = stats.rows[0]?.total || 0;
    const avgRating = parseFloat((stats.rows[0]?.avgRating || 0).toFixed(1));

    res.json({ reviews: reviews.rows, totalRatings: total, avgRating });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

export default router;
