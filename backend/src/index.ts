import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDB } from './config/database';
import { hashPassword } from './config/auth';
import authRoutes from './routes/auth';
import foodRoutes from './routes/foods';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import chatRoutes from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
  app.use('/api/chat', chatRoutes);
// Ensure all database tables exist on startup
async function ensureTables(db: any) {
  const idType = process.env.DB_TYPE === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY';

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id ${idType},
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS foods (
    id ${idType},
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS orders (
    id ${idType},
    user_id INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Patch missing columns on existing orders table (ALTER TABLE ADD COLUMN is idempotent-safe via try/catch)
  const orderColumns = ['delivery_date DATE', 'delivery_time VARCHAR(10)', 'customer_name VARCHAR(255)', 'customer_phone VARCHAR(20)', 'customer_address TEXT'];
  console.log('Checking for missing columns in orders table...');
  for (const col of orderColumns) {
    try {
      await db.query(`ALTER TABLE orders ADD COLUMN ${col}`);
      console.log(`- Added column: ${col}`);
    } catch (_e) {
      // Column already exists, skip
    }
  }

  // Patch missing columns on existing foods table
  try {
    await db.query('ALTER TABLE foods ADD COLUMN image_url VARCHAR(255)');
    console.log('- Added column: image_url to foods table');
  } catch (_e) { /* already exists */ }

  await db.query(`CREATE TABLE IF NOT EXISTS order_items (
    id ${idType},
    order_id INTEGER NOT NULL REFERENCES orders(id),
    food_id INTEGER NOT NULL REFERENCES foods(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS food_reviews (
    id ${idType},
    food_id INTEGER NOT NULL REFERENCES foods(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS chat_messages (
    id ${idType},
    user_id INTEGER NOT NULL REFERENCES users(id),
    is_admin BOOLEAN NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS payments (
    id ${idType},
    order_id INTEGER NOT NULL REFERENCES orders(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    qr_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed admin user if no users exist
  const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
  const uCount = parseInt(
    Array.isArray(usersCount.rows)
      ? (usersCount.rows[0].count || usersCount.rows[0].COUNT || 0)
      : 0
  );
  if (uCount === 0) {
    console.log('Seeding admin user...');
    const adminPassword = await hashPassword('admin123');
    await db.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
      ['admin@hotel.com', adminPassword, 'Admin', 'admin']
    );
  }

  // Seed food items if none exist
  const foodsCount = await db.query('SELECT COUNT(*) as count FROM foods');
  const fCount = parseInt(
    Array.isArray(foodsCount.rows)
      ? (foodsCount.rows[0].count || foodsCount.rows[0].COUNT || 0)
      : 0
  );
  if (fCount === 0) {
    console.log('Seeding food items...');
    const foodsList = [
      ['Veg Rice', 'Rice', 'Delicious vegetable rice', 120.00, 'https://images.unsplash.com/photo-1604908176997-125188c82c51?w=600&auto=format&q=80'],
      ['All Veg Rice', 'Rice', 'Mixed vegetable rice', 140.00, 'https://images.unsplash.com/photo-1605470669207-8e5f35f8c0ff?w=600&auto=format&q=80'],
      ['Chicken Kaddaai Rice', 'Rice', 'Spicy chicken kadai rice', 180.00, 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&auto=format&q=80'],
      ['Egg Rice', 'Rice', 'Classic egg fried rice', 150.00, 'https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=600&auto=format&q=80'],
      ['Kari Leaf Rice', 'Rice', 'Aromatic curry leaf rice', 130.00, 'https://images.unsplash.com/photo-1588167865096-71c620227d92?w=600&auto=format&q=80'],
      ['Lemon Rice', 'Rice', 'Tangy lemon rice', 110.00, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&auto=format&q=80'],
      ['Mutton Kaddaai Rice', 'Rice', 'Flavorful mutton kadai rice', 220.00, 'https://images.unsplash.com/photo-1604908554260-9f52bd70c10a?w=600&auto=format&q=80'],
      ['Nei Choru / Ghee Rice', 'Rice', 'Rich ghee rice', 160.00, 'https://images.unsplash.com/photo-1546069901-eacef0df6022?w=600&auto=format&q=80'],
      ['Paneer Fried Rice', 'Rice', 'Paneer cubes with fried rice', 170.00, 'https://images.unsplash.com/photo-1631515242808-49716c51e877?w=600&auto=format&q=80'],
      ['Spl Curd Rice', 'Rice', 'Creamy special curd rice', 100.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&q=80'],
      ['Tomato Rice', 'Rice', 'Tangy tomato rice', 110.00, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&q=80'],
      ['Veg Fried Rice', 'Rice', 'Classic vegetable fried rice', 130.00, 'https://images.unsplash.com/photo-1615937691194-96f162713970?w=600&auto=format&q=80'],
      ['Chicken Gravy', 'Gravy', 'Succulent chicken in thick gravy', 200.00, 'https://images.unsplash.com/photo-1608038509085-7bb9d5c0a3aa?w=600&auto=format&q=80'],
      ['Mutton Gravy', 'Gravy', 'Tender mutton in rich gravy', 250.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&q=80'],
      ['Mutton Paya', 'Gravy', 'Traditional mutton paya', 280.00, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&q=80'],
      ['Prawn Masala', 'Gravy', 'Spicy prawn masala gravy', 240.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&q=80'],
      ['Chicken Fry', 'Fry', 'Crispy chicken fry', 180.00, 'https://images.unsplash.com/photo-1608038509085-7bb9d5c0a3aa?w=600&auto=format&q=80'],
      ['Crab Fry Masala', 'Fry', 'Spicy crab fry masala', 260.00, 'https://images.unsplash.com/photo-1546484959-f9a9ae384058?w=600&auto=format&q=80'],
      ['Mutton Fry', 'Fry', 'Deep fried spiced mutton', 240.00, 'https://images.unsplash.com/photo-1604908176997-125188c82c51?w=600&auto=format&q=80'],
      ['Prawn Thavva Fry', 'Fry', 'Pan fried spice prawns', 250.00, 'https://images.unsplash.com/photo-1580959375944-abd7e991f971?w=600&auto=format&q=80'],
      ['Chicken Sukka', 'Dry', 'Dry roasted chicken with spices', 190.00, 'https://images.unsplash.com/photo-1619252584172-8e306f105c39?w=600&auto=format&q=80'],
      ['Mutton Sukka', 'Dry', 'Dry roasted mutton with spices', 260.00, 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&auto=format&q=80'],
      ['Nei Choru with Chicken Masala', 'Combo', 'Ghee rice served with chicken masala', 320.00, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&auto=format&q=80'],
      ['Nei Choru with Prawn Masala', 'Combo', 'Ghee rice served with prawn masala', 350.00, 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&auto=format&q=80']
    ];
    for (const food of foodsList) {
      await db.query(
        'INSERT INTO foods (name, category, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
        food
      );
    }
  }
}

// Initialize and start server
async function startServer() {
  try {
    const db = await initializeDB();
    // Test the connection
    await db.query('SELECT 1');

    // Ensure all tables exist and seed data
    await ensureTables(db);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;


