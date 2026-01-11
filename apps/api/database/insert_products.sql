-- SQL Script to Import Products and Update Schema
-- Run this script in your MySQL database

-- 0. EMPTY DATABASE (Requested: "kosongkan dulu database")
-- Using DELETE instead of TRUNCATE to avoid Foreign Key errors
-- We delete child tables first, then parents.

SET FOREIGN_KEY_CHECKS = 0; -- Try to disable checks globally just in case

DELETE FROM order_items;
DELETE FROM inventory_logs;
DELETE FROM products;
DELETE FROM categories;

-- Reset Auto Increment for categories (optional since we specify IDs or have few categories)
ALTER TABLE categories AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Add cost_price column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = "products";
SET @columnname = "purchase_price";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " DECIMAL(10, 2) DEFAULT 0 AFTER stock_quantity;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Add price_grosir and price_reseller if they don't exist
SET @columnname = "price_grosir";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " DECIMAL(10, 2) DEFAULT 0 AFTER price;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "price_reseller";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " DECIMAL(10, 2) DEFAULT 0 AFTER price_grosir;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;


-- 3. Create Categories
INSERT IGNORE INTO categories (name, slug, icon) VALUES 
('KRESEK', 'kresek', 'shopping_bag'),
('PLASTIK', 'plastik', 'shopping_bag'),
('PP 02', 'pp-02', 'inventory_2'),
('PP 05', 'pp-05', 'inventory_2'),
('PPES', 'ppes', 'inventory_2'),
('GELAS', 'gelas', 'local_drink'),
('CUP', 'cup', 'local_cafe');

-- Helper to get category IDs
SET @cat_kresek = (SELECT id FROM categories WHERE name = 'KRESEK');
SET @cat_plastik = (SELECT id FROM categories WHERE name = 'PLASTIK');
SET @cat_pp02 = (SELECT id FROM categories WHERE name = 'PP 02');
SET @cat_pp05 = (SELECT id FROM categories WHERE name = 'PP 05');
SET @cat_ppes = (SELECT id FROM categories WHERE name = 'PPES');
SET @cat_gelas = (SELECT id FROM categories WHERE name = 'GELAS');
SET @cat_cup = (SELECT id FROM categories WHERE name = 'CUP');

-- 4. Insert Products
INSERT INTO products (id, sku, name, description, category_id, purchase_price, price, price_reseller, price_grosir, stock_quantity, is_active) VALUES
(UUID(), 'KRS-TUL-50-HTM', 'TULIP 50 HTM', 'Satuan: PAK', @cat_kresek, 29000, 34000, 33000, 32000, 100, 1),
(UUID(), 'KRS-TUL-40-HPM', 'TULIP 40 HTM/PTH/MRH', 'Satuan: PAK', @cat_kresek, 14500, 17000, 16500, 16000, 100, 1),
(UUID(), 'KRS-TUL-35-HTM', 'TULIP 35 HTM', 'Satuan: PAK', @cat_kresek, 12600, 17000, 16500, 16000, 100, 1),
(UUID(), 'KRS-TUL-35-PTH', 'TULIP 35 PTH', 'Satuan: PAK', @cat_kresek, 14400, 17000, 16500, 16000, 100, 1),
(UUID(), 'KRS-TUN-30-PTH', 'TUNAS 30 PTH', 'Satuan: PAK', @cat_kresek, 14400, 17000, 16500, 16000, 100, 1),
(UUID(), 'KRS-TUN-28-PTH', 'TUNAS 28 PUTIH', 'Satuan: PAK', @cat_kresek, 14400, 17000, 16500, 16000, 100, 1),
(UUID(), 'KRS-TUN-24-PTH', 'TUNAS 24 PUTIH', 'Satuan: PAK', @cat_kresek, 14400, 17000, 16500, 16000, 100, 1),
(UUID(), 'KRS-TUN-15-PTH', 'TUNAS 15 PUTIH', 'Satuan: PAK', @cat_kresek, 14400, 17000, 16500, 16000, 100, 1),
(UUID(), 'KRS-TUL-28-HTM', 'TULIP 28 HTM', 'Satuan: PAK', @cat_kresek, 8500, 17000, 16000, 15500, 100, 1),
(UUID(), 'KRS-TUL-24-HTM', 'TULIP 24 HTM', 'Satuan: PAK', @cat_kresek, 13600, 17000, 16000, 15500, 100, 1),
(UUID(), 'KRS-TUL-15-HTM', 'TULIP 15 HTM', 'Satuan: PAK', @cat_kresek, 13600, 17000, 16000, 15500, 100, 1),
(UUID(), 'KRS-IDO-15-HTM', 'IDOLA 15 HTM', 'Satuan: PAK', @cat_kresek, 5600, 8000, 7500, 7000, 100, 1),
(UUID(), 'KRS-IDO-24-HTM', 'IDOLA 24 HTM', 'Satuan: PAK', @cat_kresek, 10500, 12500, 12000, 11500, 100, 1),
(UUID(), 'KRS-MHK-15', 'MAHKOTA 15', 'Satuan: PAK', @cat_kresek, 1250, 1500, 1400, 1400, 100, 1),
(UUID(), 'KRS-MHK-24', 'MAHKOTA 24', 'Satuan: PAK', @cat_kresek, 2200, 2500, 2400, 2400, 100, 1),
(UUID(), 'KRS-SAM-15', 'SAMUDRA 15', 'Satuan: PAK', @cat_kresek, 5000, 7000, 6000, 5800, 100, 1),
(UUID(), 'KRS-SAM-24', 'SAMUDRA 24', 'Satuan: PAK', @cat_kresek, 5000, 7000, 6000, 5800, 100, 1),
(UUID(), 'KRS-SAM-28', 'SAMUDRA 28', 'Satuan: PAK', @cat_kresek, 5000, 7000, 6000, 5800, 100, 1),
(UUID(), 'KRS-SAM-24-GR', 'SAMUDRA 24 400GR', 'Satuan: PAK', @cat_kresek, 11000, 15000, 14000, 13500, 100, 1),
(UUID(), 'KRS-DAY-24', 'DAYANA 24', 'Satuan: PAK', @cat_kresek, 11950, 15000, 14000, 13500, 100, 1),
(UUID(), 'KRS-DAY-15', 'DAYANA 15', 'Satuan: PAK', @cat_kresek, 11950, 15000, 14000, 13500, 100, 1),
(UUID(), 'KRS-PLS-1-CW', 'PLASTIK 1 CUP', 'Satuan: PAK', @cat_kresek, 2950, 4000, 3800, 3500, 100, 1),
(UUID(), 'KRS-MAC-28-WRN', 'MACAN 28 WARNA', 'Satuan: PAK', @cat_kresek, 11000, 15000, 14000, 13000, 100, 1),
(UUID(), 'KRS-MES-28', 'MESI 28 HTM', 'Satuan: PAK', @cat_kresek, 3750, 5000, 4200, 4000, 100, 1),
(UUID(), 'KRS-BEB-24', 'BEBE 24', 'Satuan: PAK', @cat_kresek, 6250, 10000, 9000, 8000, 100, 1),
(UUID(), 'KRS-BEB-15', 'BEBE 15', 'Satuan: PAK', @cat_kresek, 4000, 6000, 5000, 5000, 100, 1),
(UUID(), 'KRS-TOY-24', 'TOYA 24', 'Satuan: PAK', @cat_kresek, 1600, 2500, 2000, 1800, 100, 1),
(UUID(), 'KRS-TOY-15', 'TOYA 15', 'Satuan: PAK', @cat_kresek, 1620, 2500, 2000, 1800, 100, 1),
(UUID(), 'PLS-HDS-60X100', 'HD SAMPAH 60X100', 'Satuan: PAK', @cat_plastik, 8500, 15000, 13000, 11000, 100, 1),
(UUID(), 'PLS-ALS-20X20', 'PLASTIK ALAS 20X20', 'Satuan: PAK', @cat_plastik, 4500, 7000, 6500, 6000, 100, 1),
(UUID(), 'PP2-PUS-20X40', 'PP 02 PUSAKA 20X40', 'Satuan: PAK', @cat_pp02, 6050, 7500, 7000, 6750, 100, 1),
(UUID(), 'PP2-PUS-15X35', 'PP 02 PUSAKA 15 X 35', 'Satuan: PAK', @cat_pp02, 6050, 7500, 7000, 6750, 100, 1),
(UUID(), 'PP2-PUS-13X27', 'PP 02 PUSAKA 13 X 27', 'Satuan: PAK', @cat_pp02, 6050, 7500, 7000, 6750, 100, 1),
(UUID(), 'PP2-PUS-12X25', 'PP 02 PUSAKA 12 X 25', 'Satuan: PAK', @cat_pp02, 6050, 7500, 7000, 6750, 100, 1),
(UUID(), 'PP2-PUS-11X25', 'PP 02 PUSAKA 11 X 25', 'Satuan: PAK', @cat_pp02, 6050, 7500, 7000, 6750, 100, 1),
(UUID(), 'PP2-PUS-10X25', 'PP 02 PUSAKA 10 X 25', 'Satuan: PAK', @cat_pp02, 6050, 7500, 7000, 6750, 100, 1),
(UUID(), 'PP2-PUS-10X20', 'PP 02 PUSAKA 10 X 20', 'Satuan: PAK', @cat_pp02, 6050, 7500, 7000, 6750, 100, 1),
(UUID(), 'PP2-PUS-9X18', 'PP 02 PUSAKA 9 X 18', 'Satuan: PAK', @cat_pp02, 6050, 7500, 7000, 6750, 100, 1),
(UUID(), 'PP2-PUS-7X15', 'PP 02 PUSAKA 7 X 15', 'Satuan: PAK', @cat_pp02, 6100, 7500, 7000, 6750, 100, 1),
(UUID(), 'PP5-BNG-20X40', 'PPES BANGKUANG 20 X 40', 'Satuan: PAK', @cat_ppes, 5440, 7000, 6750, 6500, 100, 1),
(UUID(), 'PP5-BNG-15X35', 'PPES BANGKUANG 15 X 35', 'Satuan: PAK', @cat_ppes, 5440, 7000, 6750, 6500, 100, 1),
(UUID(), 'PP5-BNG-13X27', 'PPES BANGKUANG 13 X 27', 'Satuan: PAK', @cat_ppes, 5440, 7000, 6750, 6500, 100, 1),
(UUID(), 'PP5-BNG-12X25', 'PPES BANGKUANG 12 X 25', 'Satuan: PAK', @cat_ppes, 5440, 7000, 6750, 6500, 100, 1),
(UUID(), 'PP5-BNG-11X25', 'PPES BANGKUANG 11 X 25', 'Satuan: PAK', @cat_ppes, 5440, 7000, 6750, 6500, 100, 1),
(UUID(), 'PP5-BNG-10X25', 'PPES BANGKUANG 10 X 25', 'Satuan: PAK', @cat_ppes, 5440, 7000, 6750, 6500, 100, 1),
(UUID(), 'PP5-BNG-10X20', 'PPES BANGKUANG 10 X 20', 'Satuan: PAK', @cat_ppes, 5440, 7000, 6750, 6500, 100, 1),
(UUID(), 'PP5-BNG-8X25', 'PPES BANGKUANG 8 X 25', 'Satuan: PAK', @cat_ppes, 5800, 8000, 7500, 7400, 100, 1),
(UUID(), 'PP5-LIL-KECIL', 'PPES LILIN KECIL 1/2', 'Satuan: PAK', @cat_ppes, 8500, 10000, 9500, 9000, 100, 1),
(UUID(), 'PP5-LIL-3X20', 'PPES LILIN KECIL 3 X 20', 'Satuan: PAK', @cat_ppes, 9500, 11000, 10500, 10500, 100, 1),
(UUID(), 'PP5-RAI-7X10', 'RAINBOW 7 X 10', 'Satuan: PAK', @cat_pp05, 6500, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-7X12', 'RAINBOW 7 X 12', 'Satuan: PAK', @cat_pp05, 6500, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-7X15', 'RAINBOW 7 X 15', 'Satuan: PAK', @cat_pp05, 6500, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-8X12', 'RAINBOW 8 X 12', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-8X15', 'RAINBOW 8 X 15', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-9X15', 'RAINBOW 9 X 15', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-10X15', 'RAINBOW 10 X 15', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-10X20', 'RAINBOW 10 X 20', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-10X25', 'RAINBOW 10 X 25', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-11X15', 'RAINBOW 11 X 15', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-11X20', 'RAINBOW 11 X 20', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-11X25', 'RAINBOW 11 X 25', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-12X25', 'RAINBOW 12 X 25', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-13X27', 'RAINBOW 13 X 27', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-15X20', 'RAINBOW 15 X 20', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-15X25', 'RAINBOW 15 X 25', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-15X30', 'RAINBOW 15 X 30', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-15X35', 'RAINBOW 15 X 35', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-18X30', 'RAINBOW 18 X 30', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-18X35', 'RAINBOW 18 X 35', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-20X30', 'RAINBOW 20 X 30', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-20X35', 'RAINBOW 20 X 35', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-20X40', 'RAINBOW 20 X 40', 'Satuan: PAK', @cat_pp05, 6250, 8500, 8000, 7500, 100, 1),
(UUID(), 'PP5-RAI-25X40', 'RAINBOW 25 X 40', 'Satuan: PAK', @cat_pp05, 12500, 16500, 15000, 15000, 100, 1),
(UUID(), 'PP5-RAI-25X50', 'RAINBOW 25 X 50', 'Satuan: PAK', @cat_pp05, 12500, 16500, 15000, 15000, 100, 1),
(UUID(), 'PP5-RAI-30X50', 'RAINBOW 30 X 50', 'Satuan: PAK', @cat_pp05, 12500, 16500, 15000, 15000, 100, 1),
(UUID(), 'PP5-RAI-30X60', 'RAINBOW 30 X 60', 'Satuan: PAK', @cat_pp05, 12500, 16500, 15000, 15000, 100, 1),
(UUID(), 'PP5-RAI-40X60', 'RAINBOW 40 X 60', 'Satuan: PAK', @cat_pp05, 12500, 16500, 15000, 15000, 100, 1),
(UUID(), 'PP5-RAI-50X85', 'RAINBOW 50 X 85', 'Satuan: PAK', @cat_pp05, 12500, 16500, 15000, 15000, 100, 1),
(UUID(), 'PP5-RAI-60X100', 'RAINBOW 60 X 100', 'Satuan: PAK', @cat_pp05, 12500, 16500, 15000, 15000, 100, 1),
(UUID(), 'GLS-CUP-22-OVL', 'GELAS CUP 22 OVAL', 'Satuan: ROL', @cat_gelas, 12250, 17000, 17000, 15000, 100, 1),
(UUID(), 'GLS-CUP-18-OVL', 'GELAS CUP 18 OVAL', 'Satuan: ROL', @cat_gelas, 12250, 17000, 17000, 15000, 100, 1),
(UUID(), 'GLS-CUP-16-OVL', 'GELAS CUP 16 OVAL', 'Satuan: ROL', @cat_gelas, 12250, 17000, 17000, 15000, 100, 1),
(UUID(), 'GLS-CUP-14-OVL', 'GELAS CUP 14 OVAL', 'Satuan: ROL', @cat_gelas, 12250, 17000, 17000, 15000, 100, 1),
(UUID(), 'GLS-CUP-22-SLM', 'GELAS CUP 22 SLIM', 'Satuan: ROL', @cat_gelas, 12250, 17000, 17000, 15000, 100, 1),
(UUID(), 'GLS-CUP-18-SLM', 'GELAS CUP 18 SLIM', 'Satuan: ROL', @cat_gelas, 12250, 17000, 17000, 15000, 100, 1),
(UUID(), 'GLS-16-IDL', 'GELAS 16 IDOLA', 'Satuan: ROL', @cat_gelas, 6875, 9000, 8500, 8250, 100, 1),
(UUID(), 'GLS-14-IDL', 'GELAS 14 IDOLA', 'Satuan: ROL', @cat_gelas, 6875, 9000, 8500, 8250, 100, 1),
(UUID(), 'GLS-12-IDL', 'GELAS 12 IDOLA', 'Satuan: ROL', @cat_gelas, 6875, 9000, 8500, 8250, 100, 1),
(UUID(), 'GLS-10-IDL', 'GELAS 10 IDOLA', 'Satuan: ROL', @cat_gelas, 6875, 9000, 8500, 8250, 100, 1),
(UUID(), 'GLS-16-GRP', 'GELAS 16 GRAPE', 'Satuan: ROL', @cat_gelas, 6375, 8500, 8000, 7800, 100, 1),
(UUID(), 'GLS-16-KOK', 'GELAS 16 KOKITA', 'Satuan: ROL', @cat_gelas, 5375, 7000, 6500, 6000, 100, 1),
(UUID(), 'GLS-INJ-700-TTP', 'GELAS INJECTION 700ML+TTP', 'Satuan: ROL', @cat_gelas, 22250, 30000, 30000, 28000, 100, 1),
(UUID(), 'GLS-INJ-500-TTP', 'GELAS INJECTION 500ML+TTP', 'Satuan: ROL', @cat_gelas, 17625, 25000, 25000, 24000, 100, 1),
(UUID(), 'GLS-INJ-400-TTP', 'GELAS INJECTION 400ML+TTP', 'Satuan: ROL', @cat_gelas, 17375, 25000, 25000, 24000, 100, 1),
(UUID(), 'GLS-INJ-360-TTP', 'GELAS INJECTION 360ML+TTP', 'Satuan: ROL', @cat_gelas, 17375, 25000, 25000, 24000, 100, 1),
(UUID(), 'GLS-AQU-way', 'GELAS AQUA WAYANG', 'Satuan: ROL', @cat_gelas, 5225, 7000, 6500, 6400, 100, 1),
(UUID(), 'GLS-AQU-MUR', 'GELAS AQUA MURAH', 'Satuan: ROL', @cat_gelas, 3750, 5000, 4800, 4500, 100, 1),
(UUID(), 'GLS-OND', 'GELAS ONDE', 'Satuan: ROL', @cat_gelas, 6000, 9000, 8700, 8500, 100, 1),
(UUID(), 'GLS-KOP-KRT', 'GELAS KOPI KERTAS', 'Satuan: ROL', @cat_gelas, 7750, 12500, 12000, 11000, 100, 1),
(UUID(), 'CUP-AGR-120', 'CUP AGAR 120 ML', 'Satuan: PAK', @cat_cup, 4500, 8000, 7500, 7250, 100, 1);

-- Verify
SELECT COUNT(*) as 'Products Imported' FROM products WHERE category_id IN (@cat_kresek, @cat_plastik, @cat_pp02, @cat_pp05, @cat_ppes, @cat_gelas, @cat_cup);
