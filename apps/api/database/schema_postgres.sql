-- ==============================================================
-- Laksana POS - Full Complete Database Schema (PostgreSQL)
-- Compatible with: Supabase, Railway Postgres, Neon, VPS PostgreSQL
-- Version: 2.0 (All 11 Tables + Latest V2 Columns Included)
-- ==============================================================

-- 1. Users table (Admin, Cashier, Manager)
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_code VARCHAR(10),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'cashier',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products table
CREATE TABLE IF NOT EXISTS products (
    id CHAR(36) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    opening_cash DECIMAL(15, 2) DEFAULT 0,
    closing_cash DECIMAL(15, 2),
    status VARCHAR(20) DEFAULT 'open'
);

-- 7. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id CHAR(36) PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id CHAR(36) NOT NULL REFERENCES users(id),
    customer_id CHAR(36) REFERENCES customers(id) ON DELETE SET NULL,
    shift_id CHAR(36) REFERENCES shifts(id) ON DELETE SET NULL,
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id CHAR(36) NOT NULL REFERENCES products(id),
    product_name VARCHAR(100) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0
);

-- 9. Inventory Logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id CHAR(36) NOT NULL REFERENCES users(id),
    supplier_id CHAR(36) REFERENCES suppliers(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Stock Reports table
CREATE TABLE IF NOT EXISTS stock_reports (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_shift ON orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_date ON inventory_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_type ON inventory_logs(type);
CREATE INDEX IF NOT EXISTS idx_shifts_user ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_stock_reports_status ON stock_reports(status);

-- Default Admin (Password: admin123) and Cashier (PIN: 1234)
INSERT INTO users (id, username, employee_id, password_hash, pin_code, full_name, email, role, is_active) 
VALUES 
('c2bc802f-508b-4a57-8974-9892c5890001', 'admin', 'EMP001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Administrator', 'admin@pos.local', 'admin', true),
('c2bc802f-508b-4a57-8974-9892c5890002', 'cashier1', 'EMP002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1234', 'Alex Morgan', 'alex@pos.local', 'cashier', true)
ON CONFLICT (id) DO NOTHING;

-- Default Categories
INSERT INTO categories (id, name, icon, slug, is_active) VALUES
(1, 'Hot Drinks', 'coffee', 'hot-drinks', true),
(2, 'Cold Drinks', 'local_cafe', 'cold-drinks', true),
(3, 'Pastries', 'bakery_dining', 'pastries', true),
(4, 'Bakery', 'cake', 'bakery', true),
(5, 'Food', 'lunch_dining', 'food', true),
(6, 'Desserts', 'icecream', 'desserts', true),
(7, 'Snacks', 'fastfood', 'snacks', true)
ON CONFLICT (id) DO NOTHING;
