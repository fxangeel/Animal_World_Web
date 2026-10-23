-- Esquema D1 de Animal World. Se aplica con: npm run db:local  (o db:remote)
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT, about TEXT,
  status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  pass_hash TEXT NOT NULL, pass_salt TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer',
  vendor_id TEXT REFERENCES vendors(id), must_change INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, window_start INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, vendor_id TEXT NOT NULL REFERENCES vendors(id),
  name TEXT NOT NULL, brand TEXT NOT NULL, pet TEXT NOT NULL, category TEXT NOT NULL,
  price_cents INTEGER NOT NULL, old_price_cents INTEGER, unit TEXT NOT NULL, tag TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), short TEXT, description TEXT, images TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status, vendor_id);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id), customer_name TEXT NOT NULL, phone TEXT NOT NULL,
  city TEXT NOT NULL, address TEXT, delivery TEXT NOT NULL, payment TEXT NOT NULL, notes TEXT,
  subtotal_cents INTEGER NOT NULL, shipping_cents INTEGER NOT NULL, total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Recibido', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL, vendor_id TEXT NOT NULL, name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL, qty INTEGER NOT NULL, item_status TEXT NOT NULL DEFAULT 'Pendiente'
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_items_vendor ON order_items(vendor_id);
CREATE TABLE IF NOT EXISTS affiliate_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT, business TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
  email TEXT NOT NULL, city TEXT, type TEXT, status TEXT NOT NULL DEFAULT 'Nueva',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT, service TEXT NOT NULL, name TEXT NOT NULL, pet TEXT NOT NULL,
  phone TEXT NOT NULL, preferred_date TEXT, status TEXT NOT NULL DEFAULT 'Nueva',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, topic TEXT, message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
