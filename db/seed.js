const Database = require('better-sqlite3');
const path = require('path');

function seed() {
  const dbPath = path.join(__dirname, '..', 'ecommerce.db');
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log('📦 Creating tables...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      category TEXT,
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      payment_id TEXT,
      payment_status TEXT DEFAULT 'pending',
      shipping_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Check if products already exist
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (count.count > 0) {
    console.log('✅ Products already seeded. Skipping...');
    db.close();
    return;
  }

  console.log('🛍️ Seeding products...');
  const products = [
    {
      name: 'Wireless Noise-Cancelling Headphones',
      description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res Audio support. Features adaptive sound control and multipoint connection.',
      price: 299.99,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      category: 'Audio',
      stock: 45
    },
    {
      name: 'Ultra-Slim Laptop 15"',
      description: 'Powerful ultrabook with 15.6" 4K OLED display, Intel Core i7, 16GB RAM, 512GB SSD. Perfect for professionals and creators.',
      price: 1299.99,
      image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80',
      category: 'Computers',
      stock: 20
    },
    {
      name: 'Smart Watch Pro',
      description: 'Advanced fitness tracking smartwatch with ECG, blood oxygen monitoring, GPS, and 5-day battery life. Water resistant to 50m.',
      price: 399.99,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
      category: 'Wearables',
      stock: 60
    },
    {
      name: 'Mechanical Gaming Keyboard',
      description: 'RGB mechanical keyboard with Cherry MX switches, per-key lighting, programmable macros, and aircraft-grade aluminum frame.',
      price: 159.99,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
      category: 'Accessories',
      stock: 80
    },
    {
      name: '4K Webcam Ultra HD',
      description: 'Professional 4K webcam with auto-focus, built-in ring light, noise-cancelling dual microphones. Ideal for streaming and video calls.',
      price: 129.99,
      image_url: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=500&q=80',
      category: 'Accessories',
      stock: 55
    },
    {
      name: 'Portable Bluetooth Speaker',
      description: 'Waterproof portable speaker with 360° sound, 20-hour playtime, and built-in power bank. Perfect for outdoor adventures.',
      price: 89.99,
      image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80',
      category: 'Audio',
      stock: 100
    },
    {
      name: 'Wireless Gaming Mouse',
      description: 'Ultra-lightweight wireless gaming mouse with 25,600 DPI sensor, 70-hour battery, and RGB lighting. Weighs just 63g.',
      price: 79.99,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
      category: 'Accessories',
      stock: 90
    },
    {
      name: 'USB-C Hub 12-in-1',
      description: 'Premium docking station with dual HDMI, Ethernet, SD card reader, USB 3.0 ports, and 100W pass-through charging.',
      price: 69.99,
      image_url: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500&q=80',
      category: 'Accessories',
      stock: 70
    },
    {
      name: 'Curved Gaming Monitor 27"',
      description: '27-inch QHD curved gaming monitor with 165Hz refresh rate, 1ms response time, HDR400, and FreeSync Premium.',
      price: 449.99,
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
      category: 'Computers',
      stock: 25
    },
    {
      name: 'True Wireless Earbuds',
      description: 'Premium true wireless earbuds with spatial audio, adaptive EQ, 6-hour battery (30 with case), and IPX4 sweat resistance.',
      price: 199.99,
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500&q=80',
      category: 'Audio',
      stock: 75
    }
  ];

  const insert = db.prepare(
    'INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const insertMany = db.transaction((products) => {
    for (const p of products) {
      insert.run(p.name, p.description, p.price, p.image_url, p.category, p.stock);
    }
  });

  insertMany(products);

  console.log(`✅ Seeded ${products.length} products successfully!`);
  db.close();
  console.log('🎉 Database setup complete!');
}

seed();
