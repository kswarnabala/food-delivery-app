"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const database_1 = require("../config/database");
const auth_1 = require("../config/auth");
async function runMigrations() {
    try {
        const db = await (0, database_1.initializeDB)();
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
        const usersCount = parseInt(Array.isArray(usersCountResult.rows)
            ? (usersCountResult.rows[0].count || usersCountResult.rows[0].COUNT || 0)
            : (usersCountResult.rows?.count || usersCountResult[0]?.count || usersCountResult[0]?.COUNT || 0));
        if (usersCount === 0) {
            console.log('Seeding admin user...');
            const adminPassword = await (0, auth_1.hashPassword)('admin123');
            const placeholder = process.env.DB_TYPE === 'mysql' ? '?' : '$1, $2, $3, $4';
            if (process.env.DB_TYPE === 'mysql') {
                await db.query('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', ['admin@hotel.com', adminPassword, 'Admin', 'admin']);
            }
            else {
                await db.query('INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)', ['admin@hotel.com', adminPassword, 'Admin', 'admin']);
            }
        }
        // Seed food items
        const foodsCountResult = await db.query('SELECT COUNT(*) as count FROM foods');
        // Normalize count retrieval
        const count = parseInt(Array.isArray(foodsCountResult.rows)
            ? (foodsCountResult.rows[0].count || foodsCountResult.rows[0].COUNT || 0)
            : (foodsCountResult.rows?.count || foodsCountResult[0]?.count || foodsCountResult[0]?.COUNT || 0));
        if (count === 0) {
            console.log('Seeding food items...');
            const foodsList = [
                // Rice
                ['Veg Rice', 'Rice', 'Delicious vegetable rice', 120.00, ''],
                ['All Veg Rice', 'Rice', 'Mixed vegetable rice', 140.00, ''],
                ['Chicken Kaddaai Rice', 'Rice', 'Spicy chicken kadai rice', 180.00, ''],
                ['Egg Rice', 'Rice', 'Classic egg fried rice', 150.00, ''],
                ['Kari Leaf Rice', 'Rice', 'Aromatic curry leaf rice', 130.00, ''],
                ['Lemon Rice', 'Rice', 'Tangy lemon rice', 110.00, ''],
                ['Mutton Kaddaai Rice', 'Rice', 'Flavorful mutton kadai rice', 220.00, ''],
                ['Nei Choru / Ghee Rice', 'Rice', 'Rich ghee rice', 160.00, ''],
                ['Paneer Fried Rice', 'Rice', 'Paneer cubes with fried rice', 170.00, ''],
                ['Spl Curd Rice', 'Rice', 'Creamy special curd rice', 100.00, ''],
                ['Tomato Rice', 'Rice', 'Tangy tomato rice', 110.00, ''],
                ['Veg Fried Rice', 'Rice', 'Classic vegetable fried rice', 130.00, ''],
                // Gravy
                ['Chicken Gravy', 'Gravy', 'Succulent chicken in thick gravy', 200.00, ''],
                ['Mutton Gravy', 'Gravy', 'Tender mutton in rich gravy', 250.00, ''],
                ['Mutton Paya', 'Gravy', 'Traditional mutton paya', 280.00, ''],
                ['Prawn Masala', 'Gravy', 'Spicy prawn masala gravy', 240.00, ''],
                // Fry
                ['Chicken Fry', 'Fry', 'Crispy chicken fry', 180.00, ''],
                ['Crab Fry Masala', 'Fry', 'Spicy crab fry masala', 260.00, ''],
                ['Mutton Fry', 'Fry', 'Deep fried spiced mutton', 240.00, ''],
                ['Prawn Thavva Fry', 'Fry', 'Pan fried spice prawns', 250.00, ''],
                // Dry
                ['Chicken Sukka', 'Dry', 'Dry roasted chicken with spices', 190.00, ''],
                ['Mutton Sukka', 'Dry', 'Dry roasted mutton with spices', 260.00, ''],
                // Combo
                ['Nei Choru with Chicken Masala', 'Combo', 'Ghee rice served with chicken masala', 320.00, ''],
                ['Nei Choru with Prawn Masala', 'Combo', 'Ghee rice served with prawn masala', 350.00, '']
            ];
            for (const food of foodsList) {
                if (process.env.DB_TYPE === 'mysql') {
                    await db.query('INSERT INTO foods (name, category, description, price, image_url) VALUES (?, ?, ?, ?, ?)', food);
                }
                else {
                    await db.query('INSERT INTO foods (name, category, description, price, image_url) VALUES ($1, $2, $3, $4, $5)', food);
                }
            }
            console.log('Food items seeded successfully');
        }
        console.log('Migrations completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}
runMigrations();
