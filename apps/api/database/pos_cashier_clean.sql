-- ==============================================================
-- Laksana POS - Clean Master Database Seed
-- Berisi seluruh 11 tabel, 7 kategori toko asli, 55 produk asli,
-- akun admin/kasir, dan supplier tanpa riwayat transaksi lama.
-- ==============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Bersihkan tabel yang ada
DROP TABLE IF EXISTS stock_reports;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS inventory_logs;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- ==============================================================
-- Laksana POS - Full Complete Database Schema (MySQL / MariaDB)
-- Version: 2.0 (All 11 Tables + Latest V2 Columns Included)
-- ==============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users table (Admin, Cashier, Manager)
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_code VARCHAR(10),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'cashier', 'manager') NOT NULL DEFAULT 'cashier',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    category_id INT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    opening_cash DECIMAL(15, 2) DEFAULT 0,
    closing_cash DECIMAL(15, 2),
    status ENUM('open', 'closed') DEFAULT 'open',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id CHAR(36) PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id CHAR(36) NOT NULL,
    customer_id CHAR(36),
    shift_id CHAR(36),
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Inventory Logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    supplier_id CHAR(36),
    type VARCHAR(50) NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Stock Reports table
CREATE TABLE IF NOT EXISTS stock_reports (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
CREATE INDEX idx_expenses_date ON expenses(created_at);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_stock_reports_status ON stock_reports(status);

-- Default Admin (Password: admin123) and Cashier (PIN: 1234)
INSERT IGNORE INTO users (id, username, employee_id, password_hash, pin_code, full_name, email, role) 
VALUES 
('c2bc802f-508b-4a57-8974-9892c5890001', 'admin', 'EMP001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Administrator', 'admin@pos.local', 'admin'),
('c2bc802f-508b-4a57-8974-9892c5890002', 'cashier1', 'EMP002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1234', 'Alex Morgan', 'alex@pos.local', 'cashier');

-- Default Categories
INSERT IGNORE INTO categories (id, name, icon, slug) VALUES
(1, 'Peci', 'domino', 'peci'),
(2, 'Jam', 'schedule', 'jam'),
(3, 'Kertas', 'description', 'kertas'),
(4, 'ATK', 'edit', 'atk'),
(5, 'Kalkulator', 'calculate', 'kalkulator'),
(6, 'Jasa', 'design_services', 'jasa'),
(7, 'Figura', 'crop_original', 'figura');




-- -------------------------------------------------------------
-- Data Supplier
-- -------------------------------------------------------------
INSERT INTO suppliers (id, name, contact_person, phone, email, is_active) VALUES
('s1bc802f-508b-4a57-8974-9892c5890001', 'Bean Suppliers Co.', 'John Smith', '+1234567890', 'john@beansuppliers.com', 1),
('s1bc802f-508b-4a57-8974-9892c5890002', 'TechDistro Inc.', 'Jane Doe', '+0987654321', 'jane@techdistro.com', 1);

-- -------------------------------------------------------------
-- Data 55 Produk Asli Toko
-- -------------------------------------------------------------
INSERT INTO products (id, sku, name, description, price, purchase_price, stock_quantity, low_stock_threshold, category_id, image_url, is_active, created_at, updated_at) VALUES
('02fd12dd-83ae-41c9-bcde-daadb2d1bdf8', 'SKU-FIG-06A7D', 'Figura 5R', NULL, 15000.00, 9000.00, 2, 10, 7, '/uploads/img_6a0d37e0d441b6.90300160.jpg', 1, '2026-05-20 04:04:33', '2026-06-07 04:44:29'),
('0579c839-3c8a-4fea-9170-3ac6b8731b24', 'SKU-ATK-STF', 'Sterofoam', NULL, 6000.00, 4000.00, 48, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a0d3f399076e5.60639682.jpg', 1, '2026-05-19 12:58:19', '2026-05-25 21:33:42'),
('0579ebb8-75cc-498f-8557-4e771bdac9fb', 'SKU-PRI-57DD4', 'Print Text Warna Satuan', NULL, 1500.00, 0.00, 986, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a127545704172.53087410.png', 1, '2026-05-20 07:18:36', '2026-06-07 04:44:29'),
('084ccc68-9b54-4965-b70a-6f245729f96b', 'SKU-KER-A4', 'HVS A4 Copy Paper', NULL, 44000.00, 36000.00, 9, 10, 3, '/uploads/img_6a0d392acfdb55.67035427.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 23:44:53'),
('0bab540e-caa4-4688-840c-3f0925cf0c0b', 'SKU-KER-FOL', 'Kertas Folio 1Rbx3L', NULL, 1000.00, 540.00, 999, 10, 3, '/uploads/img_6a0d3fac7103a5.10846682.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 22:20:37'),
('0cd5fd6f-156e-4f8c-924e-129d3d20f0e8', 'SKU-CET-6828C', 'Cetak Foto 2R (6x9cm)', NULL, 1500.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c6a8bf653.89207024.png', 1, '2026-05-20 04:42:16', '2026-05-19 21:45:32'),
('16e3554b-1c29-4bcd-a918-7a7c1f7d271f', 'SKU-PRI-8E05B', 'Print Text Saja >20Lembar', NULL, 500.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a127512ce9834.76915484.png', 1, '2026-05-23 12:01:17', '2026-05-23 20:48:37'),
('1adb7e82-17aa-497d-9b96-fbb7b1d9798e', 'SKU-FUL-E79A4', 'Full Foto Ukuran F4', NULL, 10000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c90d1f893.61933744.png', 1, '2026-05-20 04:45:07', '2026-05-19 21:46:09'),
('1dfee7ce-2674-4ce4-abb0-0c2a05e60b70', 'SKU-PEC-DIA', 'Peci Diamor', NULL, 30000.00, 15000.00, 3, 10, 1, '/uploads/img_6a0d3fecb17737.99114687.jpg', 1, '2026-05-19 12:58:19', '2026-06-16 06:17:19'),
('2bc7ce81-8b87-45ab-97d8-c9c8b98cea21', 'SKU-CET-C7215', 'Cetak Foto 4R (10,2x15,2cm)', NULL, 4000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c76bbcfd6.90363232.png', 1, '2026-05-20 04:43:42', '2026-05-19 21:45:43'),
('32ca8640-c108-4c51-a82e-5768f023272a', 'SKU-JAS-C8978', 'Jasa Edit Foto', NULL, 2000.00, 0.00, 997, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3cc1a13aa8.26319956.png', 1, '2026-05-20 04:46:58', '2026-06-27 05:31:25'),
('347f0490-871d-43cc-8685-f8214a297276', 'SKU-ATK-RWH', 'Riwayat Hidup', NULL, 500.00, 200.00, 1, 10, 4, '/uploads/img_6a0d3df429dda2.94781375.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:55:50'),
('3665ad78-25c4-4708-a6bd-c46500dab460', 'SKU-CET-83434', 'Cetak 4 Foto 2x3cm ', NULL, 2000.00, 0.00, 997, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c5ede7644.52261082.png', 1, '2026-05-20 04:40:37', '2026-06-27 05:31:25'),
('3756a249-6e52-482b-b7d7-27018e4f398f', 'SKU-KAL-32', 'Kalkulator CC-32', NULL, 50000.00, 29500.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c602af04d43.11589924.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:05:47'),
('3936b7d2-c7ba-478c-8bc7-ae73f96b0bf2', 'SKU-CEL-0B40D', 'Celengan Kecil', NULL, 5000.00, 2500.00, 11, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a1962114d5cf5.12303446.jpg', 1, '2026-05-29 09:48:06', '2026-05-29 02:53:22'),
('3d6b696f-f20a-4cad-a224-8e49432a2925', 'SKU-FIG-D1E55', 'Figura A4', NULL, 27000.00, 15500.00, 4, 10, 7, '/uploads/img_6a0d37e7a6e641.03630251.jpg', 1, '2026-05-20 04:08:00', '2026-05-31 18:56:33'),
('43a94f7f-5dbe-48d4-9951-ad74732a978b', 'SKU-CET-C6A34', 'Cetak 6 Foto 3x4cm', NULL, 5000.00, 0.00, 996, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c646f6a70.51112498.png', 1, '2026-05-20 04:41:11', '2026-06-27 05:31:25'),
('448e38c4-0e23-4b86-a879-805f3bafea70', 'SKU-KAL-23C', 'Kalkulator CC-23CO', NULL, 55000.00, 34000.00, 1, 10, 5, '/uploads/img_6a0c60249ebe80.16568939.jpg', 1, '2026-05-19 12:58:19', '2026-08-27 20:58:27'),
('472af922-8bd6-470f-bec2-2fa8bfc12aa8', 'SKU-KER-F4', 'HVS F4 Copy Paper', NULL, 47000.00, 41000.00, 10, 10, 3, '/uploads/img_6a0d393f57e784.97302191.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 22:21:04'),
('489ae3c7-76ba-470d-a7a5-5d9dad5d2de2', 'SKU-KAL-071', 'Kalkulator PKC-0711HC', NULL, 35000.00, 25500.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c615ea697c6.41323097.webp', 1, '2026-05-19 12:58:19', '2026-06-01 19:48:17'),
('4991da58-3df7-4a65-b7af-61ce53d71b18', 'SKU-PRI-DEB8C', 'Print Text Saja satuan', NULL, 1000.00, 0.00, 997, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a127527b66600.69601830.png', 1, '2026-05-23 12:00:43', '2026-06-07 04:44:29'),
('4a2b910c-52d9-4dbc-a40e-5c47f63b6ea1', 'SKU-ATK-UND', 'Undangan Nikah', NULL, 17000.00, 12500.00, 17, 10, 4, '/uploads/img_6a0d3f7f4f9ca2.99729112.jpg', 1, '2026-05-19 12:58:19', '2026-06-07 04:44:29'),
('4b1faf54-5d0b-44d9-b23a-e49283a80bfc', 'SKU-JAM-BES', 'Jam Besar', NULL, 80000.00, 60000.00, 3, 10, 2, '', 1, '2026-05-19 12:58:19', '2026-05-19 22:18:42'),
('4e006911-b937-4291-a33b-fab893b2601d', 'SKU-FIG-7F63F', 'Figura 10R', NULL, 20000.00, 12500.00, 3, 10, 7, '/uploads/img_6a0d37b0bf19b0.00963753.jpg', 1, '2026-05-20 04:05:07', '2026-05-19 21:33:34'),
('4e3a0940-681c-4ad0-915c-165f48dddd50', 'SKU-CER-EF27D', 'Cermin A4', NULL, 30000.00, 17000.00, 2, 10, 7, '/uploads/img_6a0d3689787120.60186806.jpg', 1, '2026-05-20 04:15:56', '2026-05-19 21:33:29'),
('4fdfd6cc-eaf3-4582-9ed3-fbd11e8cc439', 'SKU-KAL-49', 'Kalkulator CC-49', NULL, 75000.00, 57500.00, 2, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c6065665d91.13107028.jpg', 1, '2026-05-19 12:58:19', '2026-06-07 04:44:29'),
('551e7ded-3534-4461-8e7e-a074906c62fb', 'SKU-FIG-B5A9C', 'Figura 30x45', NULL, 50000.00, 32000.00, 3, 10, 7, '/uploads/img_6a0d37c87d2d96.80992383.jpg', 1, '2026-05-20 04:15:10', '2026-05-19 21:34:02'),
('5579f855-95a2-441b-ab6c-c20232232c5c', 'SKU-FUL-4B749', 'Full Foto Ukuran A4', NULL, 9000.00, 0.00, 998, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c8b006811.95441348.png', 1, '2026-05-20 04:44:49', '2026-05-28 21:19:10'),
('5b1474bd-ecb5-4a35-9d2b-c3f2d10346ae', 'SKU-KAL-11A', 'Kalkulator CC-11A', NULL, 60000.00, 43500.00, 4, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c5feda4a7a9.05114698.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:04:46'),
('647071f9-7d65-400f-a07d-5a6618dac916', 'SKU-PAP-16B58', 'Paper Bag', NULL, 9000.00, 6000.00, 0, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a196271372a41.14383285.jpg', 1, '2026-05-29 04:18:09', '2026-06-07 04:44:29'),
('6a92f616-d9ee-499a-9f83-aca776ae544b', 'SKU-CET-ABCC4', 'Cetak Foto 3R(8,9x12,7cm)', NULL, 3000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c715028d2.94180362.png', 1, '2026-05-20 04:42:49', '2026-05-19 21:45:38'),
('6efb5d78-c182-43b9-81f0-a84ed360bd9c', 'SKU-KAL-40', 'Kalkulator CC-40', NULL, 65000.00, 37000.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c605f755635.07851106.jpg', 1, '2026-05-19 12:58:19', '2026-06-07 04:44:29'),
('7189d709-1cf1-4b1a-a0e2-03a6113428a9', 'SKU-KAL-1313', 'Kalkulator DTC-1313CH', NULL, 55000.00, 32000.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c615a6a4362.21554459.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:10:51'),
('815be1d0-107f-4921-8192-bd5850c22a64', 'SKU-PAP-5A533', 'Paper Bag Sedang', NULL, 6000.00, 3000.00, 98, 10, 4, '', 1, '2026-05-31 07:34:50', '2026-05-31 00:35:52'),
('83c04e7f-4232-47f0-9d16-8567ff2fa2a7', 'SKU-CEL-60558', 'Celengan Ayam', NULL, 6000.00, 4000.00, 11, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a19625363a2f1.42626894.jpg', 1, '2026-05-29 09:48:41', '2026-05-29 02:54:28'),
('84274284-b4c3-45da-84e0-908c9c77d3a2', 'SKU-CET-23C8F', 'Cetak Foto 5R (12.7x17,8cm)', NULL, 6000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c85752f06.11473914.png', 1, '2026-05-20 04:44:18', '2026-05-19 21:45:58'),
('86573072-1041-4aeb-a567-8b1522da802b', 'SKU-ATK-SKB', 'Skets Book', NULL, 20000.00, 15000.00, 6, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a0d3f07c62341.63484979.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:56:40'),
('88d20515-f464-4145-bbcb-aceeef532b84', 'SKU-KAL-63A', 'Kalkulator CC-63ACO', NULL, 75000.00, 53500.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c614eae8fe0.71785277.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:10:39'),
('8b6bce86-fb3e-4e86-ac24-87b8321bdc24', 'SKU-KAL-50', 'Kalkulator CC-50', NULL, 90000.00, 70500.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c60b66964a0.84256031.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:08:07'),
('92716080-7c14-4298-8eca-15779066a94a', 'SKU-JAM-KEC', 'Jam Kecil', NULL, 0.00, 0.00, 1, 10, 2, NULL, 1, '2026-05-19 12:58:19', '2026-05-19 05:58:19'),
('961c732f-56da-4522-ac15-aab465c1132e', 'SKU-PEC-ASW', 'Peci Aswad', NULL, 65000.00, 50000.00, 6, 10, 1, 'http://127.0.0.1:8000/uploads/img_6a0d3fe0bb8365.73589987.jpg', 1, '2026-05-19 12:58:19', '2026-06-16 06:17:19'),
('984257bd-c9e0-43cd-ab80-7c787e0e223a', 'SKU-FIG-980DA', 'Figura 25x30', NULL, 30000.00, 18000.00, 3, 10, 7, '/uploads/img_6a0d37196079b8.86095080.jpg', 1, '2026-05-20 04:18:10', '2026-05-19 21:33:50'),
('99dc6f14-5baa-48eb-be04-1efa10c0bc50', 'SKU-FIG-B5F89', 'Figura 30x40', NULL, 40000.00, 26000.00, 4, 10, 7, '/uploads/img_6a0d37c2ee0e74.82985856.jpg', 1, '2026-05-20 04:16:44', '2026-05-19 21:33:58'),
('aace9982-af0f-4fb8-84a6-807d073298ed', 'SKU-FIG-1EDFD', 'Figura 4R', NULL, 14000.00, 7500.00, 3, 10, 7, '/uploads/img_6a0d37da6d0e84.60464559.jpg', 1, '2026-05-20 04:03:59', '2026-05-19 21:34:18'),
('af0e2b53-522b-45d0-8abf-8dc123d95928', 'SKU-KER-SDF4', 'HVS SIDU F4', NULL, 50000.00, 44000.00, 5, 10, 3, 'http://127.0.0.1:8000/uploads/img_6a0d386dc14074.77852996.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:28:30'),
('bc924c42-9397-48b8-9e55-1d8125933eb7', 'SKU-KAL-90', 'Kalkulator CC-90', NULL, 35000.00, 22000.00, 1, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c6154a12288.15436154.webp', 1, '2026-05-19 12:58:19', '2026-06-01 19:47:15'),
('c966207b-cb54-423a-a8f4-45455a4322d1', 'SKU-FIG-6F622', 'Figura 12R', NULL, 40000.00, 27000.00, 4, 10, 7, '/uploads/img_6a0d37b6957a76.07630708.jpg', 1, '2026-05-20 04:07:34', '2026-05-19 21:33:40'),
('d3c34751-58f7-44dd-a49f-6f3943c10d33', 'SKU-FIG-8C465', 'Figura F4', NULL, 30000.00, 18000.00, 2, 10, 7, '/uploads/img_6a0d37ee83fb95.21250332.jpg', 1, '2026-05-20 04:11:04', '2026-05-19 21:34:27'),
('d56690fc-4317-44e2-9334-b2ecce24a55f', 'SKU-ATK-BTM', 'Buku Tamu', NULL, 15000.00, 10000.00, 10, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a0d39f21b53d8.40358462.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:34:58'),
('d6cddfc2-8dac-419d-a025-2b4bf58f6304', 'SKU-CET-A74DB', 'Cetak Foto 4x6', NULL, 1000.00, 0.00, 995, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c7d4b5c17.76570728.png', 1, '2026-05-20 04:41:31', '2026-06-27 05:31:25'),
('d7494b97-ff64-40cf-bd38-880fac0a40fc', 'SKU-PRI-E6EC9', 'Print Text Warna >20', NULL, 1000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a1275377d1133.75619900.png', 1, '2026-05-24 03:47:56', '2026-05-23 20:49:12'),
('d91624c3-19da-4ba1-ba15-d71822a6dddb', 'SKU-KER-SDA4', 'HVS SIDU A4', NULL, 45000.00, 40000.00, 4, 10, 3, 'http://127.0.0.1:8000/uploads/img_6a0d38662c92d0.11789068.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:28:23'),
('e9c1ca78-caf8-4d44-a89d-af2943335033', 'SKU-FIG-634AB', 'Figura 3R', NULL, 13000.00, 6500.00, 3, 10, 7, '/uploads/img_6a0d37d515b541.63500049.jpg', 1, '2026-05-20 04:02:40', '2026-05-19 21:34:15'),
('f92180f5-9a86-49a5-a123-37e722692e5f', 'SKU-CEL-A3469', 'Celengan Besar', NULL, 6000.00, 4000.00, 5, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a19621aeef6d3.89464935.jpg', 1, '2026-05-29 09:47:40', '2026-06-30 19:28:07'),
('fdd5cfd5-a08f-4cd8-aac8-0214f29c051d', 'SKU-FIG-97BD5', 'Figura 25x35', NULL, 40000.00, 21000.00, 3, 10, 7, '/uploads/img_6a0d37bc9ac360.64972306.jpg', 1, '2026-05-20 04:14:27', '2026-05-19 21:33:55');

SET FOREIGN_KEY_CHECKS = 1;
