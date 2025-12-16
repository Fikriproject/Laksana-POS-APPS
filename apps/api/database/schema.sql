-- POS Cashier Database Schema
-- MySQL Version

-- Users table (Admin, Cashier)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_code VARCHAR(4),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'cashier', 'manager') NOT NULL,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    category_id INT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Customers table
CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE suppliers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifts table
CREATE TABLE shifts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    opening_cash DECIMAL(10, 2) DEFAULT 0,
    closing_cash DECIMAL(10, 2),
    status ENUM('open', 'closed') DEFAULT 'open',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Orders table
CREATE TABLE orders (
    id CHAR(36) PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id CHAR(36) NOT NULL,
    customer_id CHAR(36),
    shift_id CHAR(36),
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'e-wallet', 'other') NOT NULL,
    status ENUM('pending', 'completed', 'refunded', 'cancelled') DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- Order Items table
CREATE TABLE order_items (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Inventory Logs table
CREATE TABLE inventory_logs (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    supplier_id CHAR(36),
    type ENUM('stock_in', 'stock_out', 'adjustment', 'sale') NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    status ENUM('pending', 'completed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_shift ON orders(shift_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_date ON inventory_logs(created_at);
CREATE INDEX idx_inventory_logs_type ON inventory_logs(type);
CREATE INDEX idx_shifts_user ON shifts(user_id);
CREATE INDEX idx_shifts_status ON shifts(status);

-- Insert default admin user (password: admin123, UUID generated)
INSERT INTO users (id, username, employee_id, password_hash, full_name, email, role) 
VALUES ('c2bc802f-508b-4a57-8974-9892c5890001', 'admin', 'EMP001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin@pos.local', 'admin');

-- Insert demo cashier (PIN: 1234, UUID generated)
INSERT INTO users (id, username, employee_id, password_hash, pin_code, full_name, email, role) 
VALUES ('c2bc802f-508b-4a57-8974-9892c5890002', 'cashier1', 'EMP002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1234', 'Alex Morgan', 'alex@pos.local', 'cashier');

-- Insert default categories
INSERT INTO categories (name, icon, slug) VALUES
('Hot Drinks', 'coffee', 'hot-drinks'),
('Cold Drinks', 'local_cafe', 'cold-drinks'),
('Pastries', 'bakery_dining', 'pastries'),
('Bakery', 'cake', 'bakery'),
('Food', 'lunch_dining', 'food'),
('Desserts', 'icecream', 'desserts'),
('Snacks', 'fastfood', 'snacks');

-- Insert sample products (UUIDs generated)
INSERT INTO products (id, sku, name, price, stock_quantity, category_id, is_active) VALUES
('p1bc802f-508b-4a57-8974-9892c5890001', 'SKU-CAP-001', 'Cappuccino', 4.50, 100, 1, true),
('p1bc802f-508b-4a57-8974-9892c5890002', 'SKU-LAT-001', 'Caffe Latte', 4.00, 100, 1, true),
('p1bc802f-508b-4a57-8974-9892c5890003', 'SKU-ICE-001', 'Iced Latte', 5.00, 100, 2, true),
('p1bc802f-508b-4a57-8974-9892c5890004', 'SKU-CRO-001', 'Croissant', 3.00, 50, 3, true),
('p1bc802f-508b-4a57-8974-9892c5890005', 'SKU-MUF-001', 'Blueberry Muffin', 3.50, 40, 3, true),
('p1bc802f-508b-4a57-8974-9892c5890006', 'SKU-BAG-001', 'Plain Bagel', 2.50, 60, 4, true),
('p1bc802f-508b-4a57-8974-9892c5890007', 'SKU-AVT-001', 'Avocado Toast', 8.50, 30, 5, true),
('p1bc802f-508b-4a57-8974-9892c5890008', 'SKU-CHO-001', 'Chocolate Cake', 5.50, 25, 6, true),
('p1bc802f-508b-4a57-8974-9892c5890009', 'SKU-DON-001', 'Glazed Donut', 1.50, 80, 6, true),
('p1bc802f-508b-4a57-8974-9892c5890010', 'SKU-SMO-001', 'Berry Smoothie', 6.00, 40, 2, true);

-- Insert sample supplier
INSERT INTO suppliers (id, name, contact_person, phone, email) VALUES
('s1bc802f-508b-4a57-8974-9892c5890001', 'Bean Suppliers Co.', 'John Smith', '+1234567890', 'john@beansuppliers.com'),
('s1bc802f-508b-4a57-8974-9892c5890002', 'TechDistro Inc.', 'Jane Doe', '+0987654321', 'jane@techdistro.com');

-- Expenses table
CREATE TABLE expenses (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    category ENUM('Tanah sewa', 'Arisan', 'Belanja', 'Tamu', 'Infaq', 'Lainnya') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_expenses_date ON expenses(created_at);
CREATE INDEX idx_expenses_category ON expenses(category);
