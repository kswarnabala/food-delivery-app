import { initializeDB } from '../config/database';
import { hashPassword } from '../config/auth';

export async function runMigrations() {
  try {
    const db = await initializeDB();
    console.log('Running migrations...');

    // Create users table
    const idType = process.env.DB_TYPE === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY';

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id ${idType},
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create foods table
    await db.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id ${idType},
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(255),
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id ${idType},
        user_id INTEGER NOT NULL REFERENCES users(id),
        total_amount DECIMAL(10, 2) NOT NULL,
        delivery_date DATE NOT NULL,
        delivery_time VARCHAR(10),
        status VARCHAR(50) DEFAULT 'pending',
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create order items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id ${idType},
        order_id INTEGER NOT NULL REFERENCES orders(id),
        food_id INTEGER NOT NULL REFERENCES foods(id),
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id ${idType},
        order_id INTEGER NOT NULL REFERENCES orders(id),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        qr_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed admin user
    const usersCountResult = await db.query('SELECT COUNT(*) as count FROM users');
    const usersCount = parseInt(
      Array.isArray(usersCountResult.rows)
        ? (usersCountResult.rows[0].count || usersCountResult.rows[0].COUNT || 0)
        : (usersCountResult.rows?.count || usersCountResult[0]?.count || usersCountResult[0]?.COUNT || 0)
    );

    if (usersCount === 0) {
      console.log('Seeding admin user...');
      const adminPassword = await hashPassword('admin123');
      const placeholder = process.env.DB_TYPE === 'mysql' ? '?' : '$1, $2, $3, $4';

      if (process.env.DB_TYPE === 'mysql') {
        await db.query(
          'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
          ['admin@hotel.com', adminPassword, 'Admin', 'admin']
        );
      } else {
        await db.query(
          'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
          ['admin@hotel.com', adminPassword, 'Admin', 'admin']
        );
      }
    }

    // Seed food items
    const foodsCountResult = await db.query('SELECT COUNT(*) as count FROM foods');
    // Normalize count retrieval
    const count = parseInt(
      Array.isArray(foodsCountResult.rows)
        ? (foodsCountResult.rows[0].count || foodsCountResult.rows[0].COUNT || 0)
        : (foodsCountResult.rows?.count || foodsCountResult[0]?.count || foodsCountResult[0]?.COUNT || 0)
    );

    if (count === 0) {
      console.log('Seeding food items...');
      const foodsList = [
        // Rice
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
        // Gravy
        ['Chicken Gravy', 'Gravy', 'Succulent chicken in thick gravy', 200.00, 'https://images.unsplash.com/photo-1608038509085-7bb9d5c0a3aa?w=600&auto=format&q=80'],
        ['Mutton Gravy', 'Gravy', 'Tender mutton in rich gravy', 250.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&q=80'],
        ['Mutton Paya', 'Gravy', 'Traditional mutton paya', 280.00, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&q=80'],
        ['Prawn Masala', 'Gravy', 'Spicy prawn masala gravy', 240.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&q=80'],
        // Fry
        ['Chicken Fry', 'Fry', 'Crispy chicken fry', 180.00, 'https://images.unsplash.com/photo-1608038509085-7bb9d5c0a3aa?w=600&auto=format&q=80'],
        ['Crab Fry Masala', 'Fry', 'Spicy crab fry masala', 260.00, 'https://images.unsplash.com/photo-1546484959-f9a9ae384058?w=600&auto=format&q=80'],
        ['Mutton Fry', 'Fry', 'Deep fried spiced mutton', 240.00, 'https://images.unsplash.com/photo-1604908176997-125188c82c51?w=600&auto=format&q=80'],
        ['Prawn Thavva Fry', 'Fry', 'Pan fried spice prawns', 250.00, 'https://images.unsplash.com/photo-1580959375944-abd7e991f971?w=600&auto=format&q=80'],
        // Dry
        ['Chicken Sukka', 'Dry', 'Dry roasted chicken with spices', 190.00, 'https://images.unsplash.com/photo-1619252584172-8e306f105c39?w=600&auto=format&q=80'],
        ['Mutton Sukka', 'Dry', 'Dry roasted mutton with spices', 260.00, 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&auto=format&q=80'],
        // Combo
        ['Nei Choru with Chicken Masala', 'Combo', 'Ghee rice served with chicken masala', 320.00, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&auto=format&q=80'],
        ['Nei Choru with Prawn Masala', 'Combo', 'Ghee rice served with prawn masala', 350.00, 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&auto=format&q=80']
      ];

      for (const food of foodsList) {
        if (process.env.DB_TYPE === 'mysql') {
          await db.query(
            'INSERT INTO foods (name, category, description, price, image_url) VALUES (?, ?, ?, ?, ?)',
            food
          );
        } else {
          await db.query(
            'INSERT INTO foods (name, category, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
            food
          );
        }
      }
      console.log('Food items seeded successfully');
    }

    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
