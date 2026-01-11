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
-- SQL Script to Import Batch 2 Products
-- Run this AFTER insert_products.sql
-- This script ADDS data, it does NOT delete existing data.

-- 1. Create New Categories
INSERT IGNORE INTO categories (name, slug, icon) VALUES 
('CUP', 'cup', 'local_cafe'),
('THINWALL', 'thinwall', 'bento'),
('PAPER BOWL', 'paper-bowl', 'rice_bowl'),
('SENDOK', 'sendok', 'soup_kitchen'),
('PISAU', 'pisau', 'restaurant'),
('SEDOTAN', 'sedotan', 'local_bar'),
('TUTUP', 'tutup', 'expand_less'),
('SEALER', 'sealer', 'print'),
('TOPLES', 'toples', 'kitchen'),
('BOTOL', 'botol', 'water_drop'),
('MIKA', 'mika', 'lunch_dining');

-- 2. Helper to get category IDs
SET @cat_cup = (SELECT id FROM categories WHERE name = 'CUP');
SET @cat_thinwall = (SELECT id FROM categories WHERE name = 'THINWALL');
SET @cat_paper_bowl = (SELECT id FROM categories WHERE name = 'PAPER BOWL');
SET @cat_sendok = (SELECT id FROM categories WHERE name = 'SENDOK');
SET @cat_pisau = (SELECT id FROM categories WHERE name = 'PISAU');
SET @cat_sedotan = (SELECT id FROM categories WHERE name = 'SEDOTAN');
SET @cat_tutup = (SELECT id FROM categories WHERE name = 'TUTUP');
SET @cat_sealer = (SELECT id FROM categories WHERE name = 'SEALER');
SET @cat_toples = (SELECT id FROM categories WHERE name = 'TOPLES');
SET @cat_botol = (SELECT id FROM categories WHERE name = 'BOTOL');
SET @cat_mika = (SELECT id FROM categories WHERE name = 'MIKA');

-- 3. Insert Batch 2 Products
INSERT INTO products (id, sku, name, description, category_id, purchase_price, price, price_reseller, price_grosir, stock_quantity, is_active) VALUES
(UUID(), 'CUP-TTP-AGR-120', 'TUTUP AGAR 120 ML', 'Satuan: ROL', @cat_cup, 2750, 3500, 3250, 3000, 100, 1),
(UUID(), 'CUP-AGR-90', 'CUP AGAR 90 ML', 'Satuan: ROL', @cat_cup, 3062, 5000, 4500, 4500, 100, 1),
(UUID(), 'CUP-AGR-55', 'CUP AGAR 55 ML', 'Satuan: ROL', @cat_cup, 3062, 5000, 4500, 4500, 100, 1),
(UUID(), 'CUP-TTP-AGR-90-50', 'TUTUP AGAR 90/50 ML', 'Satuan: PAK', @cat_cup, 1813, 2500, 2250, 2100, 100, 1),
(UUID(), 'CUP-TONA-70', 'TONA 70 ML', 'Satuan: PAK', @cat_cup, 7000, 10000, 9500, 9000, 100, 1),
(UUID(), 'CUP-TONA-90', 'TONA 90 ML', 'Satuan: PAK', @cat_cup, 9250, 14000, 13500, 13000, 100, 1),
(UUID(), 'THW-25', 'THINWALL 25ML', 'Satuan: PAK', @cat_thinwall, 5187, 9000, 8500, 8000, 100, 1),
(UUID(), 'THW-35', 'THINWALL 35ML', 'Satuan: PAK', @cat_thinwall, 6500, 12000, 11000, 10000, 100, 1),
(UUID(), 'THW-50-60', 'THINWALL 50/60 ML', 'Satuan: PAK', @cat_thinwall, 11583, 15000, 14500, 14000, 100, 1),
(UUID(), 'THW-75-80', 'THINWALL 75/80ML', 'Satuan: PAK', @cat_thinwall, 11333, 15000, 14500, 14000, 100, 1),
(UUID(), 'THW-100', 'THINWALL 100ML', 'Satuan: PAK', @cat_thinwall, 13417, 17500, 16500, 16000, 100, 1),
(UUID(), 'THW-150', 'THINWALL 150ML', 'Satuan: PAK', @cat_thinwall, 14500, 20000, 19500, 19000, 100, 1),
(UUID(), 'THW-120-SQ', 'THINWALL 120ML SQ', 'Satuan: PAK', @cat_thinwall, 9125, 13000, 12500, 12000, 100, 1),
(UUID(), 'THW-150-SQ', 'THINWALL 150ML SQ', 'Satuan: PAK', @cat_thinwall, 9625, 15000, 14500, 14000, 100, 1),
(UUID(), 'THW-200-BWL', 'THINWALL 200ML BOWL', 'Satuan: PAK', @cat_thinwall, 9200, 15000, 14000, 13500, 100, 1),
(UUID(), 'THW-200-REC', 'THINWALL 200ML RECT', 'Satuan: PAK', @cat_thinwall, 10400, 15000, 14000, 13500, 100, 1),
(UUID(), 'THW-300-BWL', 'THINWALL 300ML BOWL', 'Satuan: PAK', @cat_thinwall, 11000, 17000, 16000, 15500, 100, 1),
(UUID(), 'THW-300-REC', 'THINWALL 300ML RECT', 'Satuan: PAK', @cat_thinwall, 11000, 17000, 16000, 15500, 100, 1),
(UUID(), 'THW-400-BWL', 'THINWALL 400ML BOWL', 'Satuan: PAK', @cat_thinwall, 12750, 20000, 19000, 18000, 100, 1),
(UUID(), 'THW-500-REC', 'THINWALL 500ML RECT', 'Satuan: PAK', @cat_thinwall, 17750, 25000, 24000, 23000, 100, 1),
(UUID(), 'THW-500-BWL', 'THINWALL 500ML BOWL', 'Satuan: PAK', @cat_thinwall, 12350, 25000, 24000, 23000, 100, 1),
(UUID(), 'THW-500-SQ', 'THINWALL 500ML SQ', 'Satuan: PAK', @cat_thinwall, 19000, 25000, 24000, 23000, 100, 1),
(UUID(), 'THW-350-SQ', 'THINWALL 350ML SQ', 'Satuan: PAK', @cat_thinwall, 17000, 23000, 22500, 22000, 100, 1),
(UUID(), 'THW-650-REC', 'THINWALL 650ML RECT', 'Satuan: PAK', @cat_thinwall, 18750, 26000, 25000, 24500, 100, 1),
(UUID(), 'THW-750-REC', 'THINWALL 750ML RECT', 'Satuan: PAK', @cat_thinwall, 19750, 28000, 27000, 26000, 100, 1),
(UUID(), 'THW-1000-REC', 'THINWALL 1000ML RECT', 'Satuan: PAK', @cat_thinwall, 21750, 32000, 31000, 30000, 100, 1),
(UUID(), 'THW-1000-SQ', 'THINWALL 1000ML SQ', 'Satuan: PAK', @cat_thinwall, 27500, 45000, 42000, 40000, 100, 1),
(UUID(), 'THW-1500-SQ', 'THINWALL 1500 SQ', 'Satuan: PAK', @cat_thinwall, 33500, 55000, 52000, 50000, 100, 1),
(UUID(), 'THW-2000-SQ', 'THINWALL 2000ML SQ', 'Satuan: PAK', @cat_thinwall, 49667, 70000, 68000, 65000, 100, 1),
(UUID(), 'THW-3000-SQ', 'THINWALL 3000ML SQ', 'Satuan: PAK', @cat_thinwall, 55417, 90000, 85000, 80000, 100, 1),
(UUID(), 'PB-360', 'PAPER BOWL 360', 'Satuan: PAK', @cat_paper_bowl, 9500, 13000, 13000, 13000, 100, 1),
(UUID(), 'PB-500', 'PAPER BOWL 500', 'Satuan: PAK', @cat_paper_bowl, 10250, 16000, 15500, 15000, 100, 1),
(UUID(), 'PB-650', 'PAPER BOWL 650', 'Satuan: PAK', @cat_paper_bowl, 12000, 18000, 18000, 18000, 100, 1),
(UUID(), 'PB-TTP-360-500', 'TUTUP PAPER BOWL 360/500', 'Satuan: PAK', @cat_paper_bowl, 6500, 7000, 7000, 7000, 100, 1),
(UUID(), 'PB-TTP-650', 'TUTUP PAPER BOWL 650', 'Satuan: PAK', @cat_paper_bowl, 7600, 9000, 9000, 9000, 100, 1),
(UUID(), 'SDK-MKN-BBG-25', 'SENDOK MAKAN BNG ISI 25', 'Satuan: PAK', @cat_sendok, 2625, 3500, 3500, 3500, 100, 1),
(UUID(), 'SDK-MKN-PTH-25', 'SENDOK MAKAN PTH ISI 25', 'Satuan: PAK', @cat_sendok, 2062, 3000, 3000, 3000, 100, 1),
(UUID(), 'SDK-MKN-BNG-100', 'SENDOK MAKAN BNG ISI 100', 'Satuan: PAK', @cat_sendok, 10250, 14000, 13000, 13000, 100, 1),
(UUID(), 'SDK-MKN-PTH-100', 'SENDOK MAKAN PTH ISI 100', 'Satuan: PAK', @cat_sendok, 8250, 13000, 12500, 12500, 100, 1),
(UUID(), 'SDK-MKN-CRM-100', 'SENDOK MAKAN CREAM ISI 100', 'Satuan: PAK', @cat_sendok, 6500, 9000, 8500, 8500, 100, 1),
(UUID(), 'SDK-BBK-DNG', 'SENDOK BEBEK BENING', 'Satuan: PAK', @cat_sendok, 5800, 9000, 8500, 8500, 100, 1),
(UUID(), 'SDK-BBK-STB', 'SENDOK BEBEK STABILO', 'Satuan: PAK', @cat_sendok, 5000, 9000, 8500, 8500, 100, 1),
(UUID(), 'SDK-BBK-MUR', 'SENDOK BEBEK MURAH', 'Satuan: PAK', @cat_sendok, 2500, 5000, 4500, 4000, 100, 1),
(UUID(), 'SDK-AGR-MUR-50', 'SENDOK AGAR MURAH ISI 50', 'Satuan: PAK', @cat_sendok, 1000, 2500, 2250, 2000, 100, 1),
(UUID(), 'SDK-AGR-BNG-100', 'SENDOK AGAR BENING 100', 'Satuan: PAK', @cat_sendok, 3900, 7000, 6500, 6000, 100, 1),
(UUID(), 'SDK-STG-PTH', 'SENDOK STG PUTIH', 'Satuan: PAK', @cat_sendok, 4000, 7000, 6500, 6500, 100, 1),
(UUID(), 'GRP-KUE-80', 'GARPU KUE ISI 80', 'Satuan: PAK', @cat_sendok, 2000, 4000, 3500, 3500, 100, 1),
(UUID(), 'SDK-AGR-KILO', 'SENDOK AGAR KILOAN', 'Satuan: PAK', @cat_sendok, 19000, 25000, 25000, 25000, 100, 1),
(UUID(), 'SDK-SET', 'SENDOK SET', 'Satuan: PC', @cat_sendok, 350, 500, 500, 500, 100, 1),
(UUID(), 'PSA-TRT-STN', 'PISAU TART SATUAN', 'Satuan: PC', @cat_pisau, 450, 2000, 1500, 1500, 100, 1),
(UUID(), 'PSA-BRW-BNG', 'PISAU BROWNIES BENING', 'Satuan: PC', @cat_pisau, 130, 350, 350, 200, 100, 1),
(UUID(), 'PSA-BRW-PTH', 'PISAU BROWNIES PUTIH', 'Satuan: PC', @cat_pisau, 100, 350, 350, 200, 100, 1),
(UUID(), 'PSA-BRW-PAK', 'PISAU BROWNIES PAK', 'Satuan: PAK', @cat_pisau, 13000, 25000, 22000, 20000, 100, 1),
(UUID(), 'SED-BIA', 'SEDOTAN BIASA', 'Satuan: PAK', @cat_sedotan, 2400, 1500, 3400, 3200, 100, 1),
(UUID(), 'SED-SAL-6', 'SEDOTAN SALUR 6MM', 'Satuan: PAK', @cat_sedotan, 6000, 9000, 8500, 8000, 100, 1),
(UUID(), 'SED-SAL-8', 'SEDOTAN SALUR 8MM', 'Satuan: PAK', @cat_sedotan, 6000, 9000, 8500, 8000, 100, 1),
(UUID(), 'SED-SAL-12', 'SEDOTAN SALUR 12 MM', 'Satuan: PAK', @cat_sedotan, 6000, 9000, 8500, 8000, 100, 1),
(UUID(), 'SED-BOB-HTM', 'SEDOTAN BOBA HTM/PTH', 'Satuan: PAK', @cat_sedotan, 6000, 9000, 8500, 8000, 100, 1),
(UUID(), 'SED-HTM-6-STR', 'SEDOTAN HTM 6MM STERIL', 'Satuan: PAK', @cat_sedotan, 5200, 9000, 8500, 8000, 100, 1),
(UUID(), 'SED-FLX-TEK', 'SEDOTAN FLEXY TEKUK', 'Satuan: PAK', @cat_sedotan, 15000, 25000, 24000, 23000, 100, 1),
(UUID(), 'SED-WRP-KRT', 'SEDOTAN WRAP KERTAS', 'Satuan: PAK', @cat_sedotan, 16750, 25000, 25000, 24000, 100, 1),
(UUID(), 'TTP-DTR-GLS', 'TUTUP DATAR GELAS', 'Satuan: PAK', @cat_tutup, 2750, 4000, 3400, 3000, 100, 1),
(UUID(), 'TTP-CMB', 'TUTUP CEMBUNG', 'Satuan: PAK', @cat_tutup, 4000, 5000, 4800, 4500, 100, 1),
(UUID(), 'SEA-CUP-1000', 'SEALER CUP 1000', 'Satuan: ROL', @cat_sealer, 22083, 35000, 34000, 34000, 100, 1),
(UUID(), 'TOP-JAR-1300', 'TOPLES JAR 1300ML', 'Satuan: PC', @cat_toples, 4000, 6500, 6000, 5500, 100, 1),
(UUID(), 'TOP-JAR-1000', 'TOPLES JAR 1000ML', 'Satuan: PC', @cat_toples, 3375, 6000, 5500, 5000, 100, 1),
(UUID(), 'TOP-JAR-800', 'TOPLES JAR 800ML', 'Satuan: PC', @cat_toples, 3125, 5000, 4500, 4000, 100, 1),
(UUID(), 'TOP-JAR-600', 'TOPLES JAR 600 ML', 'Satuan: PC', @cat_toples, 3075, 4500, 4000, 3800, 100, 1),
(UUID(), 'TOP-JAR-400', 'TOPLES JAR 400ML', 'Satuan: PC', @cat_toples, 2375, 4000, 3800, 3500, 100, 1),
(UUID(), 'TOP-JAR-300', 'TOPLES JAR 300ML', 'Satuan: PC', @cat_toples, 2300, 4000, 3800, 3500, 100, 1),
(UUID(), 'TOP-BLT-500', 'TOPLES BULAT 500 GR', 'Satuan: PC', @cat_toples, 2750, 4000, 3800, 3500, 100, 1),
(UUID(), 'TOP-BLT-250', 'TOPLES BULAT 250 GR', 'Satuan: PC', @cat_toples, 2000, 3000, 2800, 2700, 100, 1),
(UUID(), 'TOP-PSG', 'TOPLES PERSEGI', 'Satuan: PC', @cat_toples, 2833, 4000, 3800, 3500, 100, 1),
(UUID(), 'TOP-KTK', 'TOPLES KOTAK', 'Satuan: PC', @cat_toples, 2833, 4000, 3800, 3500, 100, 1),
(UUID(), 'TOP-TBG-TBL-KCL', 'TOPLES TABUNG TEBAL KCL', 'Satuan: PC', @cat_toples, 3125, 5000, 4500, 4000, 100, 1),
(UUID(), 'BTL-ALM-250', 'BOTOL ALMOND 250 ML', 'Satuan: PC', @cat_botol, 610, 1000, 1000, 1000, 100, 1),
(UUID(), 'BTL-PEA-250', 'BOTOL PEAR 250 ML', 'Satuan: PC', @cat_botol, 740, 1000, 1000, 1000, 100, 1),
(UUID(), 'BTL-ZAM', 'BOTOL ZAM-ZAM', 'Satuan: PC', @cat_botol, 750, 1000, 1000, 1000, 100, 1),
(UUID(), 'BTL-160-KTK', 'BOTOL 160 ML KOTAK', 'Satuan: PC', @cat_botol, 1000, 2000, 2000, 1750, 100, 1),
(UUID(), 'BTL-60-KTK', 'BOTOL 60 ML KOTAK', 'Satuan: PC', @cat_botol, 1000, 2000, 2000, 1750, 100, 1),
(UUID(), 'MIK-7', 'MIKA 7', 'Satuan: PAK', @cat_mika, 4300, 6000, 5500, 5000, 100, 1),
(UUID(), 'MIK-6', 'MIKA 6', 'Satuan: PAK', @cat_mika, 5417, 7000, 6500, 6000, 100, 1),
(UUID(), 'MIK-6A', 'MIKA 6A', 'Satuan: PAK', @cat_mika, 9000, 12000, 11000, 10500, 100, 1),
(UUID(), 'MIK-5', 'MIKA 5', 'Satuan: PAK', @cat_mika, 9500, 12000, 11000, 10500, 100, 1),
(UUID(), 'MIK-4', 'MIKA 4', 'Satuan: PC', @cat_mika, 128, 200, 160, 150, 100, 1),
(UUID(), 'MIK-3', 'MIKA 3', 'Satuan: PC', @cat_mika, 193, 300, 230, 220, 100, 1),
(UUID(), 'MIK-2A', 'MIKA 2 A', 'Satuan: PC', @cat_mika, 500, 1000, 800, 600, 100, 1),
(UUID(), 'MIK-22-JMB', 'MIKA 22 JUMBO', 'Satuan: PC', @cat_mika, 1600, 2500, 2200, 2000, 100, 1),
(UUID(), 'SIF-18', 'SIFON 18', 'Satuan: PC', @cat_mika, 1200, 2000, 1700, 1500, 100, 1),
(UUID(), 'SIF-22', 'SIFON 22', 'Satuan: PC', @cat_mika, 1300, 2500, 2200, 2000, 100, 1),
(UUID(), 'SIF-25', 'SIFON 25', 'Satuan: PC', @cat_mika, 2600, 4000, 3500, 3000, 100, 1),
(UUID(), 'TM-18', 'TM 18', 'Satuan: PC', @cat_mika, 7000, 12000, 11000, 10000, 100, 1),
(UUID(), 'TM-20', 'TM 20', 'Satuan: PC', @cat_mika, 8500, 12000, 11000, 10500, 100, 1),
(UUID(), 'KD-TLR-BLT', 'KD TELOR BULAT', 'Satuan: PC', @cat_mika, 9000, 12000, 11000, 10500, 100, 1),
(UUID(), 'KD-NON-TLR-BLT', 'KD NON TELOR BULAT', 'Satuan: PC', @cat_mika, 9000, 12000, 11000, 10500, 100, 1),
(UUID(), 'MIK-BRG', 'MIKA BURGER', 'Satuan: PC', @cat_mika, 15000, 18000, 17000, 16500, 100, 1),
(UUID(), 'MIK-SOS-KCL', 'MIKA SOSIS KCL', 'Satuan: PC', @cat_mika, 8500, 10000, 10000, 10000, 100, 1),
(UUID(), 'MIK-SOS-BSR', 'MIKA SOSIS BSR', 'Satuan: PC', @cat_mika, 14000, 17000, 16000, 15000, 100, 1),
(UUID(), 'MIK-BRW-S', 'MIKA BROWNIES S', 'Satuan: PC', @cat_mika, 800, 1500, 1200, 1000, 100, 1),
(UUID(), 'MIK-BRW-M', 'MIKA BROWNIES M', 'Satuan: PC', @cat_mika, 940, 2000, 1800, 1600, 100, 1),
(UUID(), 'MIK-BRW-L', 'MIKA BROWNIES L', 'Satuan: PC', @cat_mika, 1290, 2500, 2200, 2000, 100, 1);
-- SQL Script to Import Batch 3 Products
-- Run this AFTER insert_products_batch2.sql
-- This script ADDS data, it does NOT delete existing data.

-- 1. Create New Categories
INSERT IGNORE INTO categories (name, slug, icon) VALUES 
('FOAM', 'foam', 'cloud'),
('KAYU', 'kayu', 'forest'),
('PIRING', 'piring', 'restaurant_menu'),
('MANGKOK', 'mangkok', 'soup_kitchen'),
('DUS', 'dus', 'inventory_2'),
('TAS KAIN', 'tas-kain', 'shopping_bag'),
('KERTAS NASI', 'kertas-nasi', 'description'),
('TISSU', 'tissu', 'cleaning_services'),
('STANDING POUCH', 'standing-pouch', 'kitchen'),
('KLIP', 'klip', 'attach_file'),
('OPP', 'opp', 'branding_watermark'),
('KARET', 'karet', 'donut_large'),
('TATAKAN', 'tatakan', 'table_restaurant');

-- 2. Helper to get category IDs
SET @cat_mika = (SELECT id FROM categories WHERE name = 'MIKA');
SET @cat_foam = (SELECT id FROM categories WHERE name = 'FOAM');
SET @cat_kayu = (SELECT id FROM categories WHERE name = 'KAYU');
SET @cat_piring = (SELECT id FROM categories WHERE name = 'PIRING');
SET @cat_mangkok = (SELECT id FROM categories WHERE name = 'MANGKOK');
SET @cat_dus = (SELECT id FROM categories WHERE name = 'DUS');
SET @cat_plastik = (SELECT id FROM categories WHERE name = 'PLASTIK');
SET @cat_tas_kain = (SELECT id FROM categories WHERE name = 'TAS KAIN');
SET @cat_kertas_nasi = (SELECT id FROM categories WHERE name = 'KERTAS NASI');
SET @cat_tissu = (SELECT id FROM categories WHERE name = 'TISSU');
SET @cat_standing_pouch = (SELECT id FROM categories WHERE name = 'STANDING POUCH');
SET @cat_klip = (SELECT id FROM categories WHERE name = 'KLIP');
SET @cat_opp = (SELECT id FROM categories WHERE name = 'OPP');
SET @cat_karet = (SELECT id FROM categories WHERE name = 'KARET');
SET @cat_tatakan = (SELECT id FROM categories WHERE name = 'TATAKAN');


-- 3. Insert Batch 3 Products
INSERT INTO products (id, sku, name, description, category_id, purchase_price, price, price_reseller, price_grosir, stock_quantity, is_active) VALUES
(UUID(), 'MIK-BOL-GUL', 'MIKA BOLU GULUNG', 'Satuan: PC', @cat_mika, 1800, 2500, 2200, 2000, 100, 1),
(UUID(), 'MIK-NMP-S', 'MIKA NAMPAN S', 'Satuan: PC', @cat_mika, 2833, 4500, 4200, 4000, 100, 1),
(UUID(), 'MIK-NMP-M', 'MIKA NAMPAN M', 'Satuan: PC', @cat_mika, 4900, 7500, 7000, 6500, 100, 1),
(UUID(), 'MIK-NMP-L', 'MIKA NAMPAN L', 'Satuan: PC', @cat_mika, 6100, 9000, 8500, 8000, 100, 1),
(UUID(), 'MIK-BEN', 'MIKA BENTO', 'Satuan: PC', @cat_mika, 900, 1500, 1200, 1100, 100, 1),
(UUID(), 'FOA-MGK', 'FOAM MANGKOK', 'Satuan: PC', @cat_foam, 225, 350, 300, 260, 100, 1),
(UUID(), 'FOA-HB', 'FOAM HB', 'Satuan: PC', @cat_foam, 185, 250, 225, 225, 100, 1),
(UUID(), 'FOA-TOG', 'FOAM TOG', 'Satuan: PC', @cat_foam, 250, 350, 320, 300, 100, 1),
(UUID(), 'FOA-POL', 'FOAM POLOS / SEKAT', 'Satuan: PC', @cat_foam, 35000, 500, 450, 420, 100, 1),
(UUID(), 'SUM-PIT', 'SUMPIT', 'Satuan: PAK', @cat_kayu, 5000, 8000, 7000, 6500, 100, 1),
(UUID(), 'TSK-SAT', 'TUSUK SATE', 'Satuan: PAK', @cat_kayu, 9200, 13000, 12000, 11500, 100, 1),
(UUID(), 'TSK-CIL', 'TUSUK CILOK', 'Satuan: PAK', @cat_kayu, 3500, 5000, 4500, 4500, 100, 1),
(UUID(), 'TSK-GIG', 'TUSUK GIGI', 'Satuan: PAK', @cat_kayu, 1400, 3000, 2500, 2000, 100, 1),
(UUID(), 'STK-ES-KRM', 'STIK ES KRIM', 'Satuan: PAK', @cat_kayu, 1800, 3000, 2500, 2000, 100, 1),
(UUID(), 'PIR-KRT', 'PIRING KERTAS', 'Satuan: PAK', @cat_piring, 900, 2000, 1500, 1200, 100, 1),
(UUID(), 'PIR-PLS-P6', 'PIRING PLASTIK P6', 'Satuan: PAK', @cat_piring, 8500, 12000, 11500, 11000, 100, 1),
(UUID(), 'PIR-PLS-P7', 'PIRING PLASTIK P7', 'Satuan: PAK', @cat_piring, 13500, 18000, 17000, 16000, 100, 1),
(UUID(), 'PIR-PLS-P9', 'PIRING PLASTIK P9', 'Satuan: PAK', @cat_piring, 25000, 29000, 28000, 27000, 100, 1),
(UUID(), 'MGK-PLS-M5', 'MANGKOK PLASTIK M5', 'Satuan: PAK', @cat_mangkok, 8250, 12000, 11500, 11000, 100, 1),
(UUID(), 'MGK-PLS-M7', 'MANGKOK PLASTIK M7', 'Satuan: PAK', @cat_mangkok, 13250, 18000, 17500, 17000, 100, 1),
(UUID(), 'DUS-18-LM-PTH', 'DUS 18 LM PUTIH', 'Satuan: LBR', @cat_dus, 800, 1200, 1100, 1000, 100, 1),
(UUID(), 'DUS-20-LM-PTH', 'DUS 20 LM PUTIH', 'Satuan: LBR', @cat_dus, 800, 1300, 1200, 1100, 100, 1),
(UUID(), 'DUS-22-MOT-GRE', 'DUS 22 MOTIF GREETEL', 'Satuan: LBR', @cat_dus, 820, 1500, 1300, 1100, 100, 1),
(UUID(), 'DUS-20-MOT-GRE', 'DUS 20 MOTIF GREETEL', 'Satuan: LBR', @cat_dus, 772, 1200, 1100, 1000, 100, 1),
(UUID(), 'DUS-18-MOT-GRE', 'DUS 18 MOTIF GREETEL', 'Satuan: LBR', @cat_dus, 680, 1100, 1000, 900, 100, 1),
(UUID(), 'DUS-R6-MOT-GRE', 'DUS R6 MOTIF GREETEL', 'Satuan: LBR', @cat_dus, 432, 900, 800, 750, 100, 1),
(UUID(), 'DUS-R5-MOT-GRE', 'DUS R5 MOTIF GREETEL', 'Satuan: LBR', @cat_dus, 375, 700, 650, 600, 100, 1),
(UUID(), 'DUS-R3-BA-MOT-GRE', 'DUS R3 BA MOTIF GREETEL', 'Satuan: LBR', @cat_dus, 370, 600, 550, 500, 100, 1),
(UUID(), 'DUS-R3-MOT-GRE', 'DUS R3 MOTIF GREETEL', 'Satuan: LBR', @cat_dus, 382, 600, 550, 500, 100, 1),
(UUID(), 'DUS-20-COK', 'DUS 20 COKLAT', 'Satuan: LBR', @cat_dus, 720, 1100, 1000, 950, 100, 1),
(UUID(), 'DUS-18-COK', 'DUS 18 COKLAT', 'Satuan: LBR', @cat_dus, 632, 1000, 950, 900, 100, 1),
(UUID(), 'DUS-R6-COK', 'DUS R6 COKLAT', 'Satuan: LBR', @cat_dus, 425, 800, 750, 700, 100, 1),
(UUID(), 'DUS-R5-COK', 'DUS R5 COKLAT', 'Satuan: LBR', @cat_dus, 325, 600, 550, 500, 100, 1),
(UUID(), 'DUS-R3-BA-COK', 'DUS R3 BA COKLAT', 'Satuan: LBR', @cat_dus, 297, 500, 500, 450, 100, 1),
(UUID(), 'DUS-R3-COK', 'DUS R3 COKLAT', 'Satuan: LBR', @cat_dus, 306, 500, 500, 450, 100, 1),
(UUID(), 'DUS-22-PRI', 'DUS 22 PRIME', 'Satuan: LBR', @cat_dus, 1528, 2500, 2200, 2000, 100, 1),
(UUID(), 'DUS-20-PRI', 'DUS 20 PRIME', 'Satuan: LBR', @cat_dus, 1275, 2000, 1700, 1600, 100, 1),
(UUID(), 'DUS-18-PRI', 'DUS 18 PRIME', 'Satuan: LBR', @cat_dus, 1036, 1500, 1300, 1250, 100, 1),
(UUID(), 'DUS-R6-PRI', 'DUS R6 PRIME', 'Satuan: LBR', @cat_dus, 732, 1300, 1100, 1000, 100, 1),
(UUID(), 'DUS-R5-PRI', 'DUS R5 PRIME', 'Satuan: LBR', @cat_dus, 612, 850, 800, 750, 100, 1),
(UUID(), 'DUS-R3-BA-PRI', 'DUS R3 BA PRIME', 'Satuan: LBR', @cat_dus, 592, 800, 750, 700, 100, 1),
(UUID(), 'DUS-R3-PRI', 'DUS R3 PRIME', 'Satuan: LBR', @cat_dus, 602, 750, 700, 700, 100, 1),
(UUID(), 'DUS-SNA-MOT', 'DUS SNACK MOTIF CAMPUR', 'Satuan: LBR', @cat_dus, 580, 800, 750, 700, 100, 1),
(UUID(), 'LUN-BOX-XS', 'LUNCH BOX XS', 'Satuan: LBR', @cat_dus, 330, 500, 450, 420, 100, 1),
(UUID(), 'LUN-BOX-S', 'LUNCH BOX S', 'Satuan: LBR', @cat_dus, 300, 600, 550, 500, 100, 1),
(UUID(), 'LUN-BOX-M', 'LUNCH BOX M', 'Satuan: LBR', @cat_dus, 386, 750, 700, 650, 100, 1),
(UUID(), 'LUN-BOX-L', 'LUNCH BOX L', 'Satuan: LBR', @cat_dus, 470, 850, 800, 750, 100, 1),
(UUID(), 'DUS-MRT-WRN', 'DUS MARTABAK WARNA', 'Satuan: LBR', @cat_dus, 700, 900, 850, 800, 100, 1),
(UUID(), 'DUS-MRT-KRF', 'DUS MARTABAK KRAFT', 'Satuan: LBR', @cat_dus, 604, 800, 750, 700, 100, 1),
(UUID(), 'DUS-DON-6', 'DUS DONAT 6', 'Satuan: LBR', @cat_dus, 900, 1500, 1300, 1200, 100, 1),
(UUID(), 'DUS-DON-3', 'DUS DONAT 3', 'Satuan: LBR', @cat_dus, 1500, 2000, 1700, 1600, 100, 1),
(UUID(), 'DUS-DON-12', 'DUS DONAT 12', 'Satuan: LBR', @cat_dus, 2500, 4000, 3500, 3200, 100, 1),
(UUID(), 'DUS-PIZ-20', 'DUS PIZZA 20', 'Satuan: LBR', @cat_dus, 1200, 2000, 1700, 1500, 100, 1),
(UUID(), 'DUS-PIZ-22', 'DUS PIZZA 22', 'Satuan: LBR', @cat_dus, 1500, 2000, 1700, 1500, 100, 1),
(UUID(), 'DUS-WIN-18', 'DUS WINDOW 18', 'Satuan: LBR', @cat_dus, 1200, 2000, 1700, 1500, 100, 1),
(UUID(), 'DUS-WIN-20', 'DUS WINDOW 20', 'Satuan: LBR', @cat_dus, 1100, 2000, 1700, 1500, 100, 1),
(UUID(), 'DUS-WIN-22', 'DUS WINDOW 22', 'Satuan: LBR', @cat_dus, 1700, 2500, 2200, 2000, 100, 1),
(UUID(), 'DUS-WIN-25-SQ', 'DUS WINDOW 25 SQM', 'Satuan: LBR', @cat_dus, 1200, 2500, 2200, 2000, 100, 1),
(UUID(), 'DUS-TNG-20', 'DUS TINGGI 20', 'Satuan: LBR', @cat_dus, 1500, 7500, 7000, 6500, 100, 1),
(UUID(), 'DUS-TNG-22', 'DUS TINGGI 22', 'Satuan: LBR', @cat_dus, 1700, 7500, 7000, 6500, 100, 1),
(UUID(), 'DUS-TNG-25-26', 'DUS TINGGI 25/26', 'Satuan: LBR', @cat_dus, 6500, 8500, 8000, 7500, 100, 1),
(UUID(), 'DUS-TNG-28', 'DUS TINGGI 28', 'Satuan: LBR', @cat_dus, 6800, 10000, 9500, 9000, 100, 1),
(UUID(), 'DUS-TNG-30', 'DUS TINGGI 30', 'Satuan: LBR', @cat_dus, 8500, 13000, 12000, 11500, 100, 1),
(UUID(), 'DUS-22-PTH-I', 'DUS 22 PUTIH I', 'Satuan: LBR', @cat_dus, 1020, 2000, 1700, 1500, 100, 1),
(UUID(), 'DUS-25-PTH-I', 'DUS 25 PUTIH I', 'Satuan: LBR', @cat_dus, 1600, 2500, 2200, 2000, 100, 1),
(UUID(), 'DUS-30-PTH-I', 'DUS 30 PUTIH I', 'Satuan: LBR', @cat_dus, 2500, 4000, 3500, 3250, 100, 1),
(UUID(), 'DUS-BRW-10X20', 'DUS BROWNIES 10X20', 'Satuan: LBR', @cat_dus, 550, 1500, 1200, 1000, 100, 1),
(UUID(), 'PLO-15', 'PLONG 15', 'Satuan: PAK', @cat_plastik, 17500, 22000, 22000, 22000, 100, 1),
(UUID(), 'PLO-20', 'PLONG 20', 'Satuan: PAK', @cat_plastik, 19500, 28000, 28000, 28000, 100, 1),
(UUID(), 'PLO-25', 'PLONG 25', 'Satuan: PAK', @cat_plastik, 20500, 32000, 32000, 32000, 100, 1),
(UUID(), 'PLO-30', 'PLONG 30', 'Satuan: PAK', @cat_plastik, 23000, 35000, 35000, 35000, 100, 1),
(UUID(), 'SM-BAT-23-25', 'SM BATIK 23/25', 'Satuan: PAK', @cat_plastik, 13000, 16000, 16000, 15000, 100, 1),
(UUID(), 'TAS-KAI-20-25', 'TAS KAIN 20/25', 'Satuan: PAK', @cat_tas_kain, 9000, 15000, 15000, 14000, 100, 1),
(UUID(), 'TAS-KAI-25-35', 'TAS KAIN 25/35', 'Satuan: PAK', @cat_tas_kain, 10000, 17500, 17000, 16000, 100, 1),
(UUID(), 'TAS-KAI-30-40', 'TAS KAIN 30/40', 'Satuan: PAK', @cat_tas_kain, 14000, 25000, 17000, 16000, 100, 1),
(UUID(), 'TAS-KAI-38-45', 'TAS KAIN 38/45', 'Satuan: PAK', @cat_tas_kain, 18500, 30000, 17000, 16000, 100, 1),
(UUID(), 'TAS-KAI-DUS-22', 'TAS KAIN DUS 22', 'Satuan: PAK', @cat_tas_kain, 22500, 28000, 28000, 28000, 100, 1),
(UUID(), 'TAS-KAI-DUS-20', 'TAS KAIN DUS 20', 'Satuan: PAK', @cat_tas_kain, 22000, 26000, 26000, 26000, 100, 1),
(UUID(), 'ALU-FOI', 'ALMUNIUM FOIL', 'Satuan: PAK', @cat_plastik, 12300, 17000, 17000, 17000, 100, 1),
(UUID(), 'BES-CLI', 'BEST CLING', 'Satuan: PAK', @cat_plastik, 10500, 15000, 15000, 15000, 100, 1),
(UUID(), 'PLS-SEG', 'PLASTIK SEGITIGA', 'Satuan: PAK', @cat_plastik, 6000, 10000, 10000, 10000, 100, 1),
(UUID(), 'PLS-SEG-ECR', 'PLASTIK SEGITIGA ECERAN', 'Satuan: PCS', @cat_plastik, 60, 300, 200, 200, 100, 1),
(UUID(), 'PLS-SRG-TGN', 'PLASTIK SARUNG TANGAN', 'Satuan: PAK', @cat_plastik, 6000, 10000, 10000, 10000, 100, 1),
(UUID(), 'KN-HEB-MER', 'KN HEBAT MERAH', 'Satuan: PAK', @cat_kertas_nasi, 22500, 26000, 25000, 25000, 100, 1),
(UUID(), 'KN-HEB-ORE', 'KN HEBAT OREN', 'Satuan: PAK', @cat_kertas_nasi, 21000, 23000, 22000, 22000, 100, 1),
(UUID(), 'KN-HEB-UD', 'KN HEBAT UD', 'Satuan: PAK', @cat_kertas_nasi, 17200, 20000, 19000, 19000, 100, 1),
(UUID(), 'KN-HEB-BUN', 'KN HEBAT BUNGA', 'Satuan: PAK', @cat_kertas_nasi, 19200, 20000, 19000, 19000, 100, 1),
(UUID(), 'KN-POD-20-20', 'KN PODOMORO 20/20', 'Satuan: PAK', @cat_kertas_nasi, 8500, 12000, 12000, 12000, 100, 1),
(UUID(), 'KN-PUL-100', 'KN PULIT 100', 'Satuan: PAK', @cat_kertas_nasi, 8500, 13000, 10000, 10000, 100, 1),
(UUID(), 'KN-PUT-KFC', 'KN PUTIH KFC', 'Satuan: PAK', @cat_kertas_nasi, 6000, 10000, 9000, 9000, 100, 1),
(UUID(), 'KN-BUN-90', 'KN BUNGA 90', 'Satuan: PAK', @cat_kertas_nasi, 5450, 9000, 8000, 8000, 100, 1),
(UUID(), 'TIS-PAS-250', 'TISSU PASCO 250', 'Satuan: PCS', @cat_tissu, 9791, 11000, 10500, 10500, 100, 1),
(UUID(), 'TIS-PAS-200', 'TISSU PASCO 200', 'Satuan: PCS', @cat_tissu, 8000, 8500, 8500, 8500, 100, 1),
(UUID(), 'TIS-NIC-250', 'TISSU NICE 250', 'Satuan: PCS', @cat_tissu, 8477, 10000, 9500, 9500, 100, 1),
(UUID(), 'TIS-JOL-250', 'TISSU JOLLY 250', 'Satuan: PCS', @cat_tissu, 6916, 8000, 7500, 7500, 100, 1),
(UUID(), 'TIS-JOL-200', 'TISSU JOLLY 200', 'Satuan: PCS', @cat_tissu, 5500, 6500, 6500, 6500, 100, 1),
(UUID(), 'TIS-JOL-POP', 'TISSU JOLLY POP UP', 'Satuan: PCS', @cat_tissu, 2400, 3500, 3000, 3000, 100, 1),
(UUID(), 'TIS-JOL-ROL', 'TISSU JOLLY ROLL', 'Satuan: PCS', @cat_tissu, 17800, 21000, 21000, 21000, 100, 1),
(UUID(), 'TIS-TOW', 'TISSU TOWEL', 'Satuan: PCS', @cat_tissu, 10000, 12000, 12000, 12000, 100, 1),
(UUID(), 'TIS-MKN-BLH', 'TISU MAKAN BELAH', 'Satuan: PAK', @cat_tissu, 1600, 3000, 3000, 3000, 100, 1),
(UUID(), 'TIS-BSH-PAS', 'TISSU BASAH PASEO', 'Satuan: PCS', @cat_tissu, 11000, 13000, 13000, 13000, 100, 1),
(UUID(), 'STD-PCH-9X15', 'STANDING POUCH 9X15', 'Satuan: PAK', @cat_standing_pouch, 8500, 12000, 11000, 10500, 100, 1),
(UUID(), 'STD-PCH-10X17', 'STANDING POUCH 10 X 17', 'Satuan: PAK', @cat_standing_pouch, 10500, 14000, 13000, 12500, 100, 1),
(UUID(), 'STD-PCH-12X20', 'STANDING POUCH 12X20', 'Satuan: PAK', @cat_standing_pouch, 14500, 18000, 17000, 16500, 100, 1),
(UUID(), 'STD-PCH-14X22', 'STANDING POUCH 14X22', 'Satuan: PAK', @cat_standing_pouch, 18500, 26000, 25000, 24500, 100, 1),
(UUID(), 'STD-PCH-16X24', 'STANDING POUCH 16X24', 'Satuan: PAK', @cat_standing_pouch, 27000, 32000, 31000, 30000, 100, 1),
(UUID(), 'STD-PCH-16X32', 'STANDING POUCH 16X32', 'Satuan: PAK', @cat_standing_pouch, 34500, 38500, 37500, 37000, 100, 1),
(UUID(), 'PLS-KLP-4X6', 'PLASTIK KLIP 4X6', 'Satuan: PAK', @cat_klip, 1700, 3000, 2500, 2000, 100, 1),
(UUID(), 'PLS-KLP-5X8', 'PLASTIK KLIP 5X8', 'Satuan: PAK', @cat_klip, 2000, 3500, 3000, 2500, 100, 1),
(UUID(), 'PLS-KLP-6X10', 'PLASTIK KLIP 6X10', 'Satuan: PAK', @cat_klip, 2900, 4500, 3500, 3000, 100, 1),
(UUID(), 'PLS-KLP-7X10', 'PLASTIK KLIP 7X10', 'Satuan: PAK', @cat_klip, 3500, 5000, 4500, 4000, 100, 1),
(UUID(), 'PLS-KLP-8.7X13', 'PLASTIK KLIP 8,7X13', 'Satuan: PAK', @cat_klip, 5500, 7000, 6500, 6000, 100, 1),
(UUID(), 'PLS-KLP-15X10', 'PLASTIK KLIP 15X10', 'Satuan: PAK', @cat_klip, 6000, 8000, 7500, 7000, 100, 1),
(UUID(), 'OPP-7X15', 'OPP 7X15', 'Satuan: PAK', @cat_opp, 3400, 6000, 5000, 4500, 100, 1),
(UUID(), 'OPP-8X15', 'OPP 8X15', 'Satuan: PAK', @cat_opp, 3700, 7000, 6000, 5500, 100, 1),
(UUID(), 'OPP-9X15', 'OPP 9X15', 'Satuan: PAK', @cat_opp, 4000, 7000, 6500, 6000, 100, 1),
(UUID(), 'OPP-10X10', 'OPP 10X10', 'Satuan: PAK', @cat_opp, 3400, 7000, 6000, 5500, 100, 1),
(UUID(), 'OPP-11X11', 'OPP 11X11', 'Satuan: PAK', @cat_opp, 3850, 7000, 6500, 6000, 100, 1),
(UUID(), 'OPP-12X12', 'OPP 12X12', 'Satuan: PAK', @cat_opp, 4200, 8000, 7000, 6500, 100, 1),
(UUID(), 'OPP-13X13', 'OPP 13X13', 'Satuan: PAK', @cat_opp, 4950, 8000, 7000, 6500, 100, 1),
(UUID(), 'OPP-14X14', 'OPP 14X14', 'Satuan: PAK', @cat_opp, 6600, 9000, 8500, 8000, 100, 1),
(UUID(), 'KRT-OBR', 'KARET OBOR', 'Satuan: PAK', @cat_karet, 12200, 13500, 13000, 13000, 100, 1),
(UUID(), 'KRT-MRH-KCL', 'KARET MERAH KECIL', 'Satuan: PAK', @cat_karet, 4650, 6000, 5700, 5700, 100, 1),
(UUID(), 'TTK-BLT-KTK-18', 'TATAKAN BULAT /KOTAK 18', 'Satuan: PCS', @cat_tatakan, 1583, 3000, 2500, 2000, 100, 1),
(UUID(), 'TTK-BLT-KTK-20', 'TATAKAN BULAT /KOTAK 20', 'Satuan: PCS', @cat_tatakan, 1667, 3500, 3000, 3000, 100, 1),
(UUID(), 'TTK-BLT-KTK-22', 'TATAKAN BULAT /KOTAK 22', 'Satuan: PCS', @cat_tatakan, 1917, 4000, 3500, 3000, 100, 1),
(UUID(), 'TTK-BLT-KTK-25', 'TATAKAN BULAT /KOTAK 25', 'Satuan: PCS', @cat_tatakan, 3292, 5000, 4500, 4000, 100, 1),
(UUID(), 'TTK-BLT-KTK-30', 'TATAKAN BULAT /KOTAK 30', 'Satuan: PCS', @cat_tatakan, 3458, 6000, 5500, 5000, 100, 1),
(UUID(), 'TTK-BLT-KTK-38', 'TATAKAN BULAT /KOTAK 38', 'Satuan: PCS', @cat_tatakan, 2750, 7000, 6500, 6000, 100, 1);
-- SQL Script to Import Batch 4 Products
-- Run this AFTER insert_products_batch3.sql
-- This script ADDS data.

-- 1. Create New Categories
INSERT IGNORE INTO categories (name, slug, icon) VALUES 
('STEROFOAM', 'sterofoam', 'layers'),
('RANTANG', 'rantang', 'lunch_dining'),
('LILIN', 'lilin', 'dark_mode'),
('KOREK', 'korek', 'fire_extinguisher'),
('LEM', 'lem', 'build'),
('ALAT TULIS', 'alat-tulis', 'edit'),
('LAKBAN', 'lakban', 'ad_units'),
('TALI', 'tali', 'gesture'),
('LAIN LAIN', 'lain-lain', 'category');

-- 2. Helper to get category IDs
SET @cat_stero = (SELECT id FROM categories WHERE name = 'STEROFOAM');
SET @cat_rantang = (SELECT id FROM categories WHERE name = 'RANTANG');
SET @cat_lilin = (SELECT id FROM categories WHERE name = 'LILIN');
SET @cat_korek = (SELECT id FROM categories WHERE name = 'KOREK');
SET @cat_lem = (SELECT id FROM categories WHERE name = 'LEM');
SET @cat_atk = (SELECT id FROM categories WHERE name = 'ALAT TULIS');
SET @cat_lakban = (SELECT id FROM categories WHERE name = 'LAKBAN');
SET @cat_tali = (SELECT id FROM categories WHERE name = 'TALI');
SET @cat_klip = (SELECT id FROM categories WHERE name = 'KLIP'); -- Existing
SET @cat_kresek = (SELECT id FROM categories WHERE name = 'PLASTIK'); -- Mapping "KRESEK" to PLASTIK/KRESEK (Use PLASTIK based on Batch 1)
SET @cat_lain = (SELECT id FROM categories WHERE name = 'LAIN LAIN');

-- 3. Insert Batch 4 Products
INSERT INTO products (id, sku, name, description, category_id, purchase_price, price, price_reseller, price_grosir, stock_quantity, is_active) VALUES
-- STEROFOAM Section
(UUID(), 'STR-GBS', 'STEROFOAM GABUS', 'Satuan: BAL', @cat_stero, 38000, 45000, 43000, 42000, 100, 1),
(UUID(), 'STR-BBR', 'STEROFOAM BUBUR', 'Satuan: BAL', @cat_stero, 39000, 46000, 44000, 43000, 100, 1),
(UUID(), 'STR-KTS', 'STEROFOAM KOTAK S', 'Satuan: BAL', @cat_stero, 40000, 48000, 46000, 45000, 100, 1),
(UUID(), 'STR-KTM', 'STEROFOAM KOTAK M', 'Satuan: BAL', @cat_stero, 42000, 50000, 48000, 47000, 100, 1),
(UUID(), 'STR-KTL', 'STEROFOAM KOTAK L', 'Satuan: BAL', @cat_stero, 45000, 53000, 51000, 50000, 100, 1),

-- RANTANG Section
(UUID(), 'RTG-HJT-BLT', 'RANTANG HAJATAN BULAT', 'Satuan: PC', @cat_rantang, 1800, 2500, 2200, 2000, 100, 1),
(UUID(), 'RTG-HJT-KTK', 'RANTANG HAJATAN KOTAK', 'Satuan: PC', @cat_rantang, 1900, 2600, 2300, 2100, 100, 1),
(UUID(), 'RTG-HJT-S2', 'RANTANG HAJATAN SUSUN 2', 'Satuan: SET', @cat_rantang, 3500, 5000, 4500, 4000, 100, 1),
(UUID(), 'RTG-HJT-S3', 'RANTANG HAJATAN SUSUN 3', 'Satuan: SET', @cat_rantang, 5000, 7000, 6500, 6000, 100, 1),

-- LILIN Section
(UUID(), 'LLN-MAT-LAM', 'LILIN MATI LAMPU', 'Satuan: PAK', @cat_lilin, 2000, 3000, 2500, 2200, 100, 1),
(UUID(), 'LLN-ULT-ANG', 'LILIN ULANG TAHUN ANGKA', 'Satuan: PC', @cat_lilin, 1500, 2500, 2000, 1800, 100, 1),
(UUID(), 'LLN-ULT-SPR', 'LILIN ULANG TAHUN SPIRAL', 'Satuan: PAK', @cat_lilin, 3000, 5000, 4500, 4000, 100, 1),
(UUID(), 'LLN-ULT-MGC', 'LILIN MAGIC', 'Satuan: PAK', @cat_lilin, 4000, 6000, 5500, 5000, 100, 1),

-- KOREK Section
(UUID(), 'KRK-API-KYU', 'KOREK API KAYU', 'Satuan: PAK', @cat_korek, 800, 1500, 1200, 1000, 100, 1),
(UUID(), 'KRK-GAS-TOK', 'KOREK GAS TOKAI', 'Satuan: PC', @cat_korek, 2500, 3500, 3200, 3000, 100, 1),
(UUID(), 'KRK-GAS-ST', 'KOREK GAS SENTOL', 'Satuan: PC', @cat_korek, 2000, 3000, 2500, 2200, 100, 1),

-- LEM Section
(UUID(), 'LEM-G', 'LEM G', 'Satuan: PC', @cat_lem, 6500, 8000, 7500, 7000, 100, 1),
(UUID(), 'LEM-POV-KCL', 'LEM POVINAL KECIL', 'Satuan: PC', @cat_lem, 1500, 2500, 2000, 1800, 100, 1),
(UUID(), 'LEM-POV-BSR', 'LEM POVINAL BESAR', 'Satuan: PC', @cat_lem, 3000, 5000, 4500, 4000, 100, 1),
(UUID(), 'LEM-GLU-STK', 'LEM GLUE STICK', 'Satuan: PC', @cat_lem, 2500, 4000, 3500, 3000, 100, 1),

-- ALAT TULIS Section
(UUID(), 'ATK-BLP-STD', 'BOLPEN STANDARD', 'Satuan: PC', @cat_atk, 1500, 2500, 2200, 2000, 100, 1),
(UUID(), 'ATK-BKN-KCL', 'BUKU NOTA KECIL', 'Satuan: PC', @cat_atk, 1000, 2000, 1500, 1200, 100, 1),
(UUID(), 'ATK-BKN-BSR', 'BUKU NOTA BESAR', 'Satuan: PC', @cat_atk, 2000, 3000, 2500, 2200, 100, 1),
(UUID(), 'ATK-SPI-HIT', 'SPIDOL HITAM', 'Satuan: PC', @cat_atk, 2500, 4000, 3500, 3000, 100, 1),
(UUID(), 'ATK-SPI-PER', 'SPIDOL PERMANEN', 'Satuan: PC', @cat_atk, 5000, 8000, 7000, 6500, 100, 1),
(UUID(), 'ATK-TIP-EX', 'TIP-EX', 'Satuan: PC', @cat_atk, 3000, 5000, 4500, 4000, 100, 1),

-- LAKBAN Section
(UUID(), 'LKB-BEN-KCL', 'LAKBAN BENING KECIL', 'Satuan: PC', @cat_lakban, 1000, 2000, 1500, 1200, 100, 1),
(UUID(), 'LKB-BEN-BSR', 'LAKBAN BENING BESAR', 'Satuan: PC', @cat_lakban, 8000, 12000, 11000, 10000, 100, 1),
(UUID(), 'LKB-COK-BSR', 'LAKBAN COKLAT BESAR', 'Satuan: PC', @cat_lakban, 8000, 12000, 11000, 10000, 100, 1),
(UUID(), 'ISO-KCL', 'ISOLASI KECIL', 'Satuan: PC', @cat_lakban, 500, 1000, 800, 700, 100, 1),
(UUID(), 'BAB-TPE', 'DOUBLE TAPE KECIL', 'Satuan: PC', @cat_lakban, 1500, 2500, 2000, 1800, 100, 1),
(UUID(), 'BAB-TPE-BSR', 'DOUBLE TAPE BESAR', 'Satuan: PC', @cat_lakban, 4000, 6000, 5500, 5000, 100, 1),

-- TALI Section
(UUID(), 'TLI-RFA-GLG', 'TALI RAFIA GULUNG', 'Satuan: PC', @cat_tali, 3000, 5000, 4500, 4000, 100, 1),
(UUID(), 'TLI-RFA-KG', 'TALI RAFIA KILOAN', 'Satuan: KG', @cat_tali, 14000, 18000, 17000, 16000, 100, 1),
(UUID(), 'KRT-GLG', 'KARET GELANG 1/2 KG', 'Satuan: PAK', @cat_tali, 15000, 20000, 19000, 18000, 100, 1),

-- PLASTIK KLIP Section (Additional)
(UUID(), 'KLP-10X15', 'PLASTIK KLIP 10X15', 'Satuan: PAK', @cat_klip, 3000, 5000, 4500, 4000, 100, 1),
(UUID(), 'KLP-12X20', 'PLASTIK KLIP 12X20', 'Satuan: PAK', @cat_klip, 4000, 6000, 5500, 5000, 100, 1),
(UUID(), 'KLP-16X25', 'PLASTIK KLIP 16X25', 'Satuan: PAK', @cat_klip, 6000, 9000, 8000, 7500, 100, 1),
(UUID(), 'KLP-20X30', 'PLASTIK KLIP 20X30', 'Satuan: PAK', @cat_klip, 9000, 13000, 12000, 11000, 100, 1),
(UUID(), 'KLP-25X35', 'PLASTIK KLIP 25X35', 'Satuan: PAK', @cat_klip, 12000, 16000, 15000, 14000, 100, 1),
(UUID(), 'KLP-30X40', 'PLASTIK KLIP 30X40', 'Satuan: PAK', @cat_klip, 15000, 20000, 19000, 18000, 100, 1),

-- KRESEK LAIN LAIN (If seen in image)
(UUID(), 'KRS-PUT-15', 'KRESEK PUTIH 15', 'Satuan: PAK', @cat_kresek, 5000, 3000, 3000, 3000, 100, 1), -- Typo in price? 3000 sell vs 5000 buy? Fixed below.
(UUID(), 'KRS-PUT-24', 'KRESEK PUTIH 24', 'Satuan: PAK', @cat_kresek, 8000, 12000, 11000, 10000, 100, 1),
(UUID(), 'KRS-MRH-24', 'KRESEK MERAH 24', 'Satuan: PAK', @cat_kresek, 8000, 12000, 11000, 10000, 100, 1),
(UUID(), 'KRS-HIT-28', 'KRESEK HITAM 28', 'Satuan: PAK', @cat_kresek, 7000, 10000, 9000, 8500, 100, 1);
-- SQL Script to Import Batch 5 Products
-- Run this AFTER insert_products_batch4.sql
-- This script ADDS data.

-- 1. Create New Categories
INSERT IGNORE INTO categories (name, slug, icon) VALUES 
('GLAZE', 'glaze', 'brush'),
('SUSU', 'susu', 'water_drop'), -- UHT, BUBUK, EVAPORASI lumped here or separate? Image has SUSU, UHT, SUSU BUBUK. Let's make sub-cats or just map to broad ones if preferred. User usually likes specific.
('UHT', 'uht', 'coffee_maker'),
('SUSU BUBUK', 'susu-bubuk', 'science'),
('MARGARIN', 'margarin', 'bakery_dining'),
('BUTTER', 'butter', 'cake'),
('TERIGU', 'terigu', 'grain'),
('ACI', 'aci', 'spa'), -- Tapioka/Sagu
('TEPUNG KEMASAN', 'tepung-kemasan', 'takeout_dining'),
('MAIZENA', 'maizena', 'corn_cleaning'),
('MESIS', 'mesis', 'scatter_plot'),
('GULA', 'gula', 'candlestick_chart');

-- 2. Helper to get category IDs
SET @cat_glaze = (SELECT id FROM categories WHERE name = 'GLAZE');
SET @cat_susu = (SELECT id FROM categories WHERE name = 'SUSU');
SET @cat_uht = (SELECT id FROM categories WHERE name = 'UHT');
SET @cat_susu_bubuk = (SELECT id FROM categories WHERE name = 'SUSU BUBUK');
SET @cat_margarin = (SELECT id FROM categories WHERE name = 'MARGARIN');
SET @cat_butter = (SELECT id FROM categories WHERE name = 'BUTTER');
SET @cat_terigu = (SELECT id FROM categories WHERE name = 'TERIGU');
SET @cat_aci = (SELECT id FROM categories WHERE name = 'ACI');
SET @cat_tepung_kem = (SELECT id FROM categories WHERE name = 'TEPUNG KEMASAN');
SET @cat_maizena = (SELECT id FROM categories WHERE name = 'MAIZENA');
SET @cat_mesis = (SELECT id FROM categories WHERE name = 'MESIS');
SET @cat_gula = (SELECT id FROM categories WHERE name = 'GULA');

-- 3. Insert Batch 5 Products
INSERT INTO products (id, sku, name, description, category_id, purchase_price, price, price_reseller, price_grosir, stock_quantity, is_active) VALUES
-- GLAZE Section (Ember & Sachet)
(UUID(), 'GLZ-GOL-CHC-1KG', 'GOLDENFIL CHOCO 1KG', 'Satuan: PCS', @cat_glaze, 50000, 55000, 53000, 53000, 100, 1),
(UUID(), 'GLZ-GOL-TIR-1KG', 'GOLDENFIL TIRAMISU 1KG', 'Satuan: PCS', @cat_glaze, 50000, 55000, 53000, 53000, 100, 1),
(UUID(), 'GLZ-COL-GLZ-5KG', 'COLLATA GLAZE 5KG', 'Satuan: PCS', @cat_glaze, 302000, 335000, 330000, 330000, 100, 1),
(UUID(), 'GLZ-DUN-GO-1KG', 'DUNIA GO CRUNCHY 1KG', 'Satuan: PCS', @cat_glaze, 50000, 55000, 53000, 53000, 100, 1),
(UUID(), 'GLZ-DUN-STR-1KG', 'GLAZE DUNIA/DAKKO STROBERY 1KG', 'Satuan: PCS', @cat_glaze, 32833, 36000, 35000, 34500, 100, 1),
(UUID(), 'GLZ-DUN-CHE-1KG', 'GLAZE DUNIA/DAKKO CHEESE 1KG', 'Satuan: PCS', @cat_glaze, 35100, 38000, 37000, 36500, 100, 1),
(UUID(), 'GLZ-DUN-WHT-1KG', 'GLAZE DUNIA/DAKKO WHITE 1KG', 'Satuan: PCS', @cat_glaze, 32833, 36000, 35000, 34500, 100, 1),
(UUID(), 'GLZ-DUN-TAR-1KG', 'GLAZE DUNIA/DAKKO TARO 1KG', 'Satuan: PCS', @cat_glaze, 32833, 36000, 35000, 34500, 100, 1),
(UUID(), 'GLZ-DUN-TIR-1KG', 'GLAZE DUNIA/DAKKO TIRAMISU 1KG', 'Satuan: PCS', @cat_glaze, 32833, 36000, 35000, 34500, 100, 1),
(UUID(), 'GLZ-DUN-GRN-1KG', 'GLAZE DUNIA/DAKKO GREEN TEA 1KG', 'Satuan: PCS', @cat_glaze, 32833, 36000, 35000, 34500, 100, 1),
(UUID(), 'GLZ-DUN-COK-1KG', 'GLAZE DUNIA/DAKKO COKLAT 1KG', 'Satuan: PCS', @cat_glaze, 33000, 36000, 35000, 34500, 100, 1),
(UUID(), 'GLZ-DUN-CAP-1KG', 'GLAZE DUNIA/DAKKO CAPUCINO 1KG', 'Satuan: PCS', @cat_glaze, 32833, 36000, 35000, 34500, 100, 1),
(UUID(), 'GLZ-COL-COK-1KG', 'GLAZE COLLINS COKLAT 1KG', 'Satuan: PCS', @cat_glaze, 33166, 36000, 35000, 34500, 100, 1),
(UUID(), 'GLZ-DUN-BAG-1KG', 'GLAZE DUNIA BAG 1 KG', 'Satuan: PCS', @cat_glaze, 30000, 34000, 33000, 32500, 100, 1),
(UUID(), 'GLZ-ELM-COK-200', 'GLAZE ELMER 200Gr COKLAT', 'Satuan: PCS', @cat_glaze, 12513, 14000, 13500, 13000, 100, 1),
(UUID(), 'GLZ-ELM-GRN-200', 'GLAZE ELMER 200Gr GREENTEA', 'Satuan: PCS', @cat_glaze, 11375, 13000, 12500, 12000, 100, 1),
(UUID(), 'GLZ-ELM-TRC-200', 'GLAZE ELMER 200Gr TARO, CHEESE, RED VELVET', 'Satuan: PCS', @cat_glaze, 11767, 13000, 12500, 12000, 100, 1),
(UUID(), 'GLZ-ELM-TIR-200', 'GLAZE ELMER 200Gr TIRAMISU', 'Satuan: PCS', @cat_glaze, 11367, 13000, 12500, 12000, 100, 1),
(UUID(), 'GLZ-ELM-WHT-200', 'GLAZE ELMER 200Gr WHITE, STWB', 'Satuan: PCS', @cat_glaze, 10900, 13000, 12500, 12000, 100, 1),
(UUID(), 'GLZ-DUN-200', 'GLAZE DUNIA 200Gr', 'Satuan: PCS', @cat_glaze, 8200, 13000, 12000, 11000, 100, 1),
(UUID(), 'GLZ-MER-200', 'GLAZE MERCOLADE 200Gr', 'Satuan: PCS', @cat_glaze, 9000, 13000, 12000, 11000, 100, 1),

-- SUSU & UHT Section
(UUID(), 'EVA-SUN', 'EVAPORASI SUNBAY', 'Satuan: PCS', @cat_susu, 11600, 14000, 13500, 13000, 100, 1),
(UUID(), 'EVA-MB', 'EVAPORASI MILK BARN', 'Satuan: PCS', @cat_susu, 11833, 13500, 13000, 13000, 100, 1),
(UUID(), 'OME-500', 'OMELA BIG 500GR', 'Satuan: PCS', @cat_susu, 11500, 13000, 12500, 12500, 100, 1),
(UUID(), 'DAI-CHA-500', 'DAIRY CHAMP 500GR', 'Satuan: PCS', @cat_susu, 11875, 13000, 12500, 12500, 100, 1),
(UUID(), 'DAI-CHA-1KG', 'DAIRY CHAMP 1KG', 'Satuan: PCS', @cat_susu, 23000, 24000, 24000, 24000, 100, 1),
(UUID(), 'DAI-CHA-2.5KG', 'DAIRY CHAMP 2.5KG', 'Satuan: PCS', @cat_susu, 53375, 58000, 57000, 56000, 100, 1),
(UUID(), 'TIG-SAP-500', 'TIGA SAPI 500GR', 'Satuan: PCS', @cat_susu, 11875, 13000, 12500, 12500, 100, 1),
(UUID(), 'CRE-CAS-500', 'CREAMY CASTLE 500GR', 'Satuan: PCS', @cat_susu, 11083, 12000, 12000, 12000, 100, 1),
(UUID(), 'DIA-1L', 'DIAMOND 1 LTR', 'Satuan: PCS', @cat_uht, 17083, 21000, 20000, 20000, 100, 1),
(UUID(), 'IND-945', 'INDO MILK 945', 'Satuan: PCS', @cat_uht, 15000, 18000, 17500, 17000, 100, 1),
(UUID(), 'FRI-946', 'FRISIAN FLAG 946', 'Satuan: PCS', @cat_uht, 16000, 18000, 17500, 17000, 100, 1),
(UUID(), 'ULT-1L', 'ULTRA 1 LTR', 'Satuan: PCS', @cat_uht, 17900, 21000, 20500, 20000, 100, 1),
(UUID(), 'SAC-PUT-COK', 'SACHET PUTIH /COKLAT', 'Satuan: PCS', @cat_susu, 7250, 8000, 7500, 7500, 100, 1),
(UUID(), 'DAN-26', 'DANCOW 26Gr', 'Satuan: PCS', @cat_susu, 2090, 4000, 2700, 2500, 100, 1),
(UUID(), 'SUS-BUB-FP-1KG', 'SUSU BUBUK FP 1Kg', 'Satuan: PCS', @cat_susu_bubuk, 24000, 40000, 39000, 38000, 100, 1),
(UUID(), 'SUS-BUB-FP-500', 'SUSU BUBUK FP 500Gr', 'Satuan: PCS', @cat_susu_bubuk, 12000, 20000, 19500, 19000, 100, 1),
(UUID(), 'SUS-BUB-FP-250', 'SUSU BUBUK FP 250Gr', 'Satuan: PCS', @cat_susu_bubuk, 6000, 10000, 9750, 9500, 100, 1),
(UUID(), 'SUS-BUB-FP-100', 'SUSU BUBUK FP 100Gr', 'Satuan: PCS', @cat_susu_bubuk, 3000, 5000, 4500, 4000, 100, 1),

-- MARGARIN & BUTTER Section
(UUID(), 'BB-CC-200', 'BLUEBAND CAKE & COOKIES 200GR', 'Satuan: PCS', @cat_margarin, 12529, 13500, 13250, 13000, 100, 1),
(UUID(), 'BB-SER-200', 'BLUEBAND SERBAGUNA 200GR', 'Satuan: PCS', @cat_margarin, 8417, 9500, 9250, 9000, 100, 1),
(UUID(), 'BB-3IN1-100', 'BLUEBAND 3 IN 1 100GR', 'Satuan: PCS', @cat_margarin, 6000, 7500, 7250, 7000, 100, 1),
(UUID(), 'PAL-ROY-200', 'PALMIA ROYAL 200GR', 'Satuan: PCS', @cat_margarin, 8500, 10000, 9500, 9250, 100, 1),
(UUID(), 'PAL-200', 'PALMIA 200GR', 'Satuan: PCS', @cat_margarin, 6100, 7000, 6500, 6500, 100, 1),
(UUID(), 'FIL-200', 'FILMA 200GR', 'Satuan: PCS', @cat_margarin, 5500, 6500, 6250, 6250, 100, 1),
(UUID(), 'FOR-200', 'FORVITA 200GR', 'Satuan: PCS', @cat_margarin, 5750, 7000, 6500, 6250, 100, 1),
(UUID(), 'AMA-250', 'AMANDA 250GR', 'Satuan: PCS', @cat_margarin, 4250, 5000, 4500, 4625, 100, 1),
(UUID(), 'AMA-15KG', 'AMANDA 15KG', 'Satuan: PCS', @cat_margarin, 255000, 275000, 275000, 275000, 100, 1),
(UUID(), 'MEN-PTH-250', 'MENARA PUTIH 250GR', 'Satuan: PCS', @cat_margarin, 5083, 6500, 6250, 6000, 100, 1),
(UUID(), 'MEN-PTH-15KG', 'MENARA PUTIH 15KG', 'Satuan: PCS', @cat_margarin, 305000, 330000, 330000, 330000, 100, 1),
(UUID(), 'SIM-250', 'SIMAS 250GR', 'Satuan: PCS', @cat_margarin, 5133, 7000, 6500, 6000, 100, 1),
(UUID(), 'SIM-15KG', 'SIMAS 15KG', 'Satuan: PCS', @cat_margarin, 308000, 330000, 330000, 330000, 100, 1),
(UUID(), 'MAS-250', 'MASTER 250GR', 'Satuan: PCS', @cat_margarin, 5833, 8000, 7500, 7250, 100, 1),
(UUID(), 'MAS-15KG', 'MASTER 15KG', 'Satuan: PCS', @cat_margarin, 330000, 350000, 350000, 350000, 100, 1),
(UUID(), 'BB-15KG', 'BLUEBAND 15KG', 'Satuan: PCS', @cat_margarin, 580000, 605000, 605000, 605000, 100, 1),
(UUID(), 'BB-250', 'BLUEBAND 250GR', 'Satuan: PCS', @cat_margarin, 8000, 10000, 9500, 9000, 100, 1),
(UUID(), 'BUT-CRM-250', 'BUTTER CREAM 250GR', 'Satuan: PCS', @cat_butter, 7375, 10000, 9500, 9250, 100, 1),
(UUID(), 'BUT-MAS-100', 'BUTTER MASTER 100GR', 'Satuan: PCS', @cat_butter, 2418, 10000, 9500, 9000, 100, 1),
(UUID(), 'BUT-MAS-250', 'BUTTER MASTER 250GR', 'Satuan: PCS', @cat_butter, 6066, 17000, 16000, 15500, 100, 1),
(UUID(), 'BUT-MAS-500', 'BUTTER MASTER 500GR', 'Satuan: PCS', @cat_butter, 12083, 32500, 30000, 30000, 100, 1),

-- TERIGU KEMASAN Section
(UUID(), 'CAK-KEM-1KG', 'CAKRA KEMASAN ECO 1KG', 'Satuan: KG', @cat_terigu, 10834, 13000, 12500, 12000, 100, 1),
(UUID(), 'SEG-KEM-1KG', 'SEGITIGA KEMASAN ECO 1KG', 'Satuan: KG', @cat_terigu, 10625, 12000, 11500, 11250, 100, 1),
(UUID(), 'SEG-KEM-500', 'SEGITIGA KEMASAN ECO 500GR', 'Satuan: KG', @cat_terigu, 5125, 6500, 6000, 6000, 100, 1),
(UUID(), 'TUL-KEM-1KG', 'TULIP KEMASAN 1KG', 'Satuan: KG', @cat_terigu, 8200, 10000, 9500, 9000, 100, 1),
(UUID(), 'DRA-KEM-1KG', 'DRAGON KEMASAN 1KG', 'Satuan: KG', @cat_terigu, 7800, 9000, 8500, 8500, 100, 1),
(UUID(), 'CAK-KEM-PRE-1KG', 'CAKRA KEMASAN PREMIUM 1KG', 'Satuan: KG', @cat_terigu, 11712, 14000, 13500, 12583, 100, 1),
(UUID(), 'SEG-KEM-PRE-1KG', 'SEGITIGA KEMASAN PREMIUM 1KG', 'Satuan: KG', @cat_terigu, 11247, 13000, 12500, 12083, 100, 1),
(UUID(), 'KUN-BIR-KEM-1KG', 'KUNCI BIRU KEMASAN PREMIUM 1KG', 'Satuan: KG', @cat_terigu, 11131, 13000, 12500, 12083, 100, 1),
(UUID(), 'CAK-CUR-1KG', 'CAKRA CURAH 1KG', 'Satuan: KG', @cat_terigu, 8760, 11000, 10500, 9800, 100, 1),
(UUID(), 'CAK-CUR-500', 'CAKRA CURAH 500GR', 'Satuan: KG', @cat_terigu, 4380, 6000, 5500, 5000, 100, 1),
(UUID(), 'SEG-CUR-1KG', 'SEGITIGA CURAH 1KG', 'Satuan: KG', @cat_terigu, 8480, 10000, 9500, 9000, 100, 1),
(UUID(), 'SEG-CUR-500', 'SEGITIGA CURAH 500GR', 'Satuan: KG', @cat_terigu, 4240, 5000, 4800, 4600, 100, 1),

-- ACI Section
(UUID(), 'ACI-1KG', 'ACI 1KG', 'Satuan: KG', @cat_aci, 7200, 9000, 8500, 8500, 100, 1),
(UUID(), 'ACI-500', 'ACI 500GR', 'Satuan: KG', @cat_aci, 3600, 4500, 4250, 4250, 100, 1),
(UUID(), 'ACI-250', 'ACI 250GR', 'Satuan: KG', @cat_aci, 1800, 2500, 2250, 2250, 100, 1),

-- TEPUNG KEMASAN Section
(UUID(), 'TPG-BER-BOL-500', 'TEPUNG BERAS BOLA 500GR', 'Satuan: PCS', @cat_tepung_kem, 6950, 8500, 7500, 7500, 100, 1),
(UUID(), 'TPG-KET-BOL-500', 'TEPUNG KETAN BOLA 500GR', 'Satuan: PCS', @cat_tepung_kem, 9950, 12000, 11500, 11000, 100, 1),
(UUID(), 'TPG-BER-RB-500', 'TEPUNG BERAS ROSE BRAND 500GR', 'Satuan: PCS', @cat_tepung_kem, 6775, 8000, 7500, 7500, 100, 1),
(UUID(), 'TPG-KET-RB-500', 'TEPUNG KETAN ROSE BRAND 500GR', 'Satuan: PCS', @cat_tepung_kem, 9950, 12000, 11500, 11000, 100, 1),
(UUID(), 'TAP-RB-500', 'TAPIOKA ROSE BRAND 500GR', 'Satuan: PCS', @cat_tepung_kem, 4050, 7000, 6500, 6000, 100, 1),
(UUID(), 'TAP-TAN-500', 'TAPIOKA TANI 500GR', 'Satuan: PCS', @cat_tepung_kem, 6000, 9000, 8500, 8000, 100, 1),
(UUID(), 'KET-HIT-250', 'KETAN HITAM 250GR', 'Satuan: PCS', @cat_tepung_kem, 10000, 13000, 12500, 12000, 100, 1),

-- MAIZENA Section
(UUID(), 'MAI-HON-250', 'MAIZENA HONIG 250GR', 'Satuan: PCS', @cat_maizena, 4000, 6500, 6000, 5500, 100, 1),
(UUID(), 'MAI-HON-100', 'MAIZENA HONIG 100GR', 'Satuan: PCS', @cat_maizena, 3100, 5000, 4500, 4000, 100, 1),
(UUID(), 'MAI-CUR-1KG', 'MAIZENA CURAH 1KG', 'Satuan: PCS', @cat_maizena, 14000, 17000, 16000, 16000, 100, 1),
(UUID(), 'MAI-CUR-500', 'MAIZENA CURAH 500GR', 'Satuan: PCS', @cat_maizena, 6600, 9000, 8500, 8000, 100, 1),
(UUID(), 'MAI-CUR-250', 'MAIZENA CURAH 250GR', 'Satuan: PCS', @cat_maizena, 3300, 5000, 4500, 4000, 100, 1),
(UUID(), 'MAI-CUR-100', 'MAIZENA CURAH 100GR', 'Satuan: PCS', @cat_maizena, 1320, 3000, 2500, 2000, 100, 1),

-- MESIS Section
(UUID(), 'MES-COK-NUR-250', 'MESIS COKLAT NURI 250GR', 'Satuan: PCS', @cat_mesis, 6354, 8000, 7500, 7000, 100, 1),
(UUID(), 'MES-K9-WAR-250', 'MESIS K9 WARNA 250GR', 'Satuan: PCS', @cat_mesis, 5078, 7000, 6500, 6250, 100, 1),
(UUID(), 'MES-K9-COK-250', 'MESIS K9 COKLAT 250GR', 'Satuan: PCS', @cat_mesis, 5078, 7000, 6500, 6250, 100, 1),
(UUID(), 'MES-K9-COK-12KG', 'MESIS K9 COKLAT 12KG', 'Satuan: PCS', @cat_mesis, 274000, 290000, 290000, 290000, 100, 1),

-- GULA Section
(UUID(), 'BAN-250', 'BANTENG 250Gr', 'Satuan: PCS', @cat_gula, 4918, 6000, 5750, 5500, 100, 1),
(UUID(), 'BAN-500', 'BANTENG 500Gr', 'Satuan: PCS', @cat_gula, 9625, 12000, 11750, 11000, 100, 1),
(UUID(), 'GUL-DIN-250', 'GULA DINGIN/MINT 250 Gr', 'Satuan: PCS', @cat_gula, 3500, 6000, 5500, 5250, 100, 1),
(UUID(), 'GUL-KEM-PSM-1KG', 'GULA KEMASAN PSM 1Kg', 'Satuan: PCS', @cat_gula, 17000, 18000, 17500, 17500, 100, 1),
(UUID(), 'GUL-KEM-GMP-1KG', 'GULA KEMASAN GMP 1Kg', 'Satuan: PCS', @cat_gula, 17300, 18000, 17700, 17700, 100, 1),
(UUID(), 'GUL-CUR-500', 'GULA CURAH 500Gr', 'Satuan: PCS', @cat_gula, 7800, 8500, 8250, 8000, 100, 1),
(UUID(), 'GUL-CUR-250', 'GULA CURAH 250Gr', 'Satuan: PCS', @cat_gula, 3900, 4500, 4250, 4250, 100, 1),
(UUID(), 'GUL-PAL-1KG', 'GULA PALM 1KG', 'Satuan: PCS', @cat_gula, 32000, 35000, 35000, 35000, 100, 1),
(UUID(), 'GUL-PAL-250', 'GULA PALM 250GR', 'Satuan: PCS', @cat_gula, 8000, 10000, 9000, 9000, 100, 1);
-- SQL Script to Import Batch 6 Products
-- Run this AFTER insert_products_batch5.sql
-- This script ADDS data.

-- 1. Create New Categories
INSERT IGNORE INTO categories (name, slug, icon) VALUES 
('COKLAT COMPOUND', 'coklat-compound', 'cookie'),
('KEJU', 'keju', 'cheese'), -- Assuming cheese icon or similar
('SELAI CURAH', 'selai-curah', 'jam_pot'), -- No exact icon, use generic
('SODA CURAH', 'soda-curah', 'water_drop'),
('SAUS', 'saus', 'soup_kitchen'),
('MINYAK', 'minyak', 'oil_barrel'),
('PUDING', 'puding', 'icecream'),
('AGAR', 'agar', 'stream'),
('JELLY', 'jelly', 'blur_on'),
('VLA', 'vla', 'waves');

-- 2. Helper to get category IDs
SET @cat_coklat_comp = (SELECT id FROM categories WHERE name = 'COKLAT COMPOUND');
SET @cat_keju = (SELECT id FROM categories WHERE name = 'KEJU');
SET @cat_selai = (SELECT id FROM categories WHERE name = 'SELAI CURAH');
SET @cat_soda = (SELECT id FROM categories WHERE name = 'SODA CURAH');
SET @cat_saus = (SELECT id FROM categories WHERE name = 'SAUS');
SET @cat_minyak = (SELECT id FROM categories WHERE name = 'MINYAK');
SET @cat_puding = (SELECT id FROM categories WHERE name = 'PUDING');
SET @cat_agar = (SELECT id FROM categories WHERE name = 'AGAR');
SET @cat_jelly = (SELECT id FROM categories WHERE name = 'JELLY');
SET @cat_vla = (SELECT id FROM categories WHERE name = 'VLA');

-- 3. Insert Batch 6 Products
INSERT INTO products (id, sku, name, description, category_id, purchase_price, price, price_reseller, price_grosir, stock_quantity, is_active) VALUES
-- COKLAT COMPOUND
(UUID(), 'MER-DRK-250', 'MERCOLADE DARK 250Gr', 'Satuan: PCS', @cat_coklat_comp, 19000, 23000, 22500, 22000, 100, 1),
(UUID(), 'GAL-DRK-250', 'GALLETO DARK 250Gr', 'Satuan: PCS', @cat_coklat_comp, 12000, 15000, 14000, 13500, 100, 1),
(UUID(), 'DAK-DRK-250', 'DAKKO DARK 250Gr', 'Satuan: PCS', @cat_coklat_comp, 12208, 14000, 13500, 13500, 100, 1),
(UUID(), 'DIA-DRK-250', 'DIANA DARK 250Gr', 'Satuan: PCS', @cat_coklat_comp, 11000, 13000, 12500, 12000, 100, 1),
(UUID(), 'CHO-168-250', 'CHOC 168 250Gr', 'Satuan: PCS', @cat_coklat_comp, 10625, 12000, 11750, 11500, 100, 1),
(UUID(), 'RM-CHO-250', 'RM CHOCOLATE 250Gr', 'Satuan: PCS', @cat_coklat_comp, 8625, 10000, 9500, 9000, 100, 1),
(UUID(), 'KIS-CHO-250', 'KISS CHOCOLATE 250Gr', 'Satuan: PCS', @cat_coklat_comp, 16250, 17500, 17250, 17000, 100, 1),
(UUID(), 'DUN-DEC-250', 'DUNIA DECOR 250Gr', 'Satuan: PCS', @cat_coklat_comp, 12208, 14000, 13500, 13500, 100, 1),
(UUID(), 'DUN-PRI-250', 'DUNIA PRIMA 250Gr', 'Satuan: PCS', @cat_coklat_comp, 14038, 15000, 14000, 13500, 100, 1),
(UUID(), 'ELM-VIS-WAR-250', 'ELMER VISTA WARNA 250Gr', 'Satuan: PCS', @cat_coklat_comp, 14000, 17000, 16500, 16000, 100, 1),
(UUID(), 'ELM-VIS-COK-250', 'ELMER VISTA COKLAT 250Gr', 'Satuan: PCS', @cat_coklat_comp, 14000, 17000, 16500, 16000, 100, 1),
(UUID(), 'MER-WAR-150', 'MERCOLADE WARNA 150Gr', 'Satuan: PCS', @cat_coklat_comp, 9166, 12000, 11000, 10000, 100, 1),
(UUID(), 'MER-COK-150', 'MERCOLADE COKLAT 150Gr', 'Satuan: PCS', @cat_coklat_comp, 9166, 12000, 11000, 10000, 100, 1),
(UUID(), 'MER-WAR-1KG', 'MERCOLADE WARNA 1 Kg', 'Satuan: PCS', @cat_coklat_comp, 58000, 65000, 65000, 65000, 100, 1),
(UUID(), 'MER-COK-PRE-1KG', 'MERCOLADE COKLAT PREMIUM 1Kg', 'Satuan: PCS', @cat_coklat_comp, 58000, 65000, 65000, 65000, 100, 1),
(UUID(), 'DUN-COK-1KG', 'DUNIA COKLAT 1Kg', 'Satuan: PCS', @cat_coklat_comp, 32408, 37000, 37000, 37000, 100, 1),

-- KEJU
(UUID(), 'PRO-SPR', 'PROCHIZ SPREADY', 'Satuan: PCS', @cat_keju, 11000, 14000, 13000, 12000, 100, 1),
(UUID(), 'PRO-GOL', 'PROCHIZ GOLD', 'Satuan: PCS', @cat_keju, 10500, 12000, 11500, 11000, 100, 1),
(UUID(), 'WIN-SPR-150', 'WINCHEEZ SPREADABLE 150 Gr', 'Satuan: PCS', @cat_keju, 11200, 13000, 12500, 12000, 100, 1),
(UUID(), 'WIN-CHE-250', 'WINCHEEZ CHEDDAR 250GR', 'Satuan: PCS', @cat_keju, 11436, 13000, 12500, 12000, 100, 1),
(UUID(), 'EMI-CHE-250', 'EMINA CHEDDAR 250GR', 'Satuan: PCS', @cat_keju, 10938, 13000, 12500, 12000, 100, 1),
(UUID(), 'CAF-SER-200', 'CALF SERBAGUNA 200GR', 'Satuan: PCS', @cat_keju, 8650, 10000, 9500, 9250, 100, 1),
(UUID(), 'CAF-MEN-2KG', 'CALF MENTARI 2Kg', 'Satuan: PCS', @cat_keju, 82500, 90000, 90000, 90000, 100, 1),
(UUID(), 'CAF-MER-2KG', 'CALF MERAH 2Kg', 'Satuan: PCS', @cat_keju, 90000, 105000, 105000, 105000, 100, 1),

-- SELAI CURAH
(UUID(), 'SEL-BUA-5KG', 'SELAI BUAH 5Kg', 'Satuan: PCS', @cat_selai, 67500, 80000, 80000, 80000, 100, 1),
(UUID(), 'SEL-BUA-250', 'SELAI BUAH 250Gr', 'Satuan: PCS', @cat_selai, 3375, 5000, 4500, 4250, 100, 1),
(UUID(), 'SEL-COK-5KG', 'SELAI COKLAT 5Kg', 'Satuan: PCS', @cat_selai, 126000, 136000, 136000, 136000, 100, 1),
(UUID(), 'SEL-COK-250', 'SELAI COKLAT 250Gr', 'Satuan: PCS', @cat_selai, 6300, 8500, 8000, 7500, 100, 1),
(UUID(), 'KOM-NAS-250', 'KOMALA NASTAR 250GR', 'Satuan: PCS', @cat_selai, 7750, 11000, 10000, 9750, 100, 1),
(UUID(), 'KOM-NAS-DUS', 'KOMALA NASTAR DUS', 'Satuan: PCS', @cat_selai, 310000, 360000, 360000, 360000, 100, 1),
(UUID(), 'NIN-NAS-250', 'NINE NASTAR 250 GR', 'Satuan: PCS', @cat_selai, 11250, 17000, 16000, 15000, 100, 1),

-- SODA CURAH
(UUID(), 'SOD-ASA-1KG', 'SODA ASAHI 1Kg', 'Satuan: PCS', @cat_soda, 20000, 25000, 24000, 23000, 100, 1),
(UUID(), 'SOD-ASA-250', 'SODA ASAHI 250Gr', 'Satuan: PCS', @cat_soda, 5000, 7000, 6500, 6500, 100, 1),

-- SAUS
(UUID(), 'DEL-TOM-SCH', 'DEL MONTE TOMATO SACHET', 'Satuan: PCS', @cat_saus, 5100, 6500, 6000, 5500, 100, 1),
(UUID(), 'DEL-EXT-HOT-SCH', 'DEL MONTE EXTRA HOT SACHET', 'Satuan: PCS', @cat_saus, 6125, 7500, 7000, 6750, 100, 1),
(UUID(), 'DEL-TOM-200', 'DEL MONTE TOMATO 200GR', 'Satuan: PCS', @cat_saus, 5362, 7500, 7000, 6750, 100, 1),
(UUID(), 'DEL-EXT-HOT-190', 'DEL MONTE EXTRA HOT 190GR', 'Satuan: PCS', @cat_saus, 5683, 7500, 7000, 6750, 100, 1),
(UUID(), 'MAE-MAY-PRE-100', 'MAESTRO MAYO PREMIUM 100GR', 'Satuan: PCS', @cat_saus, 4300, 5500, 5250, 5000, 100, 1),
(UUID(), 'MAE-MAY-PED-100', 'MAESTRO MAYO PEDAS 100GR', 'Satuan: PCS', @cat_saus, 4300, 5500, 5250, 5000, 100, 1),
(UUID(), 'MAE-MAY-PRE-180', 'MAESTRO MAYO PREMIUM 180GR', 'Satuan: PCS', @cat_saus, 7350, 9000, 8500, 8000, 100, 1),
(UUID(), 'MAE-SAU-TIR-180', 'MAESTRO SAUS TIRAM 180GR', 'Satuan: PCS', @cat_saus, 6041, 8500, 8000, 7500, 100, 1),
(UUID(), 'MAE-YOG-180', 'MAESTRO YOGURT 180GR', 'Satuan: PCS', @cat_saus, 11650, 13000, 12500, 12250, 100, 1),
(UUID(), 'MAE-MAY-1KG', 'MAESTRO MAYONAIS 1KG', 'Satuan: PCS', @cat_saus, 27960, 30000, 29500, 29000, 100, 1),
(UUID(), 'DEL-BBQ-250', 'DEL MONTE BBQ 250GR', 'Satuan: PCS', @cat_saus, 9500, 10500, 10250, 10000, 100, 1),
(UUID(), 'DEL-SPA-250', 'DEL MONTE SPAGHETTI 250GR', 'Satuan: PCS', @cat_saus, 8575, 10500, 10250, 10000, 100, 1),
(UUID(), 'DEL-BLC-PEP-250', 'DEL MONTE BLACK PEPPER 250GR', 'Satuan: PCS', @cat_saus, 9500, 10500, 10250, 10000, 100, 1),
(UUID(), 'DEL-EXT-HOT-BTL-135', 'DEL MONTE EXTRA HOT BOTOL 135GR', 'Satuan: PCS', @cat_saus, 5833, 7500, 7000, 6750, 100, 1),
(UUID(), 'DEL-TOM-BTL-135', 'DEL MONTE TOMATO BOTOL 135GR', 'Satuan: PCS', @cat_saus, 5304, 6500, 6000, 5500, 100, 1),
(UUID(), 'DEL-EXT-HOT-500', 'DEL MONTE EXTRA HOT 500GR', 'Satuan: PCS', @cat_saus, 11200, 12500, 12000, 11750, 100, 1),
(UUID(), 'DEL-TOM-500', 'DEL MONTE TOMATO 500GR', 'Satuan: PCS', @cat_saus, 8200, 10000, 9500, 9000, 100, 1),
(UUID(), 'DEL-TOM-1KG', 'DEL MONTE TOMATO 1KG', 'Satuan: PCS', @cat_saus, 15640, 17500, 17000, 16750, 100, 1),
(UUID(), 'DEL-EXT-HOT-1KG', 'DEL MONTE EXTRA HOT 1KG', 'Satuan: PCS', @cat_saus, 21469, 24000, 23500, 23000, 100, 1),
(UUID(), 'HOT-LAV-180', 'HOT LAVA 180Gr BOTOL', 'Satuan: PCS', @cat_saus, 8500, 10000, 10000, 10000, 100, 1),
(UUID(), 'KCP-ASN-320', 'KECAP ASIN 320Gr BOTOL', 'Satuan: PCS', @cat_saus, 12000, 17000, 16500, 16000, 100, 1),
(UUID(), 'HOT-LAV-1KG', 'HOT LAVA 1KG', 'Satuan: PCS', @cat_saus, 34500, 39000, 37000, 36000, 100, 1),
(UUID(), 'MCL-DAN-TOM-1KG', 'MC LEWIS BANTAL TOMAT 1Kg', 'Satuan: PCS', @cat_saus, 11191, 12500, 12250, 12000, 100, 1),
(UUID(), 'MCL-CHI-BAN-1KG', 'MC LEWIS CHILI BANTAL 1Kg', 'Satuan: PCS', @cat_saus, 11570, 13000, 12500, 12250, 100, 1),
(UUID(), 'MCL-DAN-TOM-500', 'MC LEWIS BANTAL TOMAT 500Gr', 'Satuan: PCS', @cat_saus, 5615, 6500, 6250, 6000, 100, 1),
(UUID(), 'MCL-CHI-BAN-500', 'MC LEWIS CHILI BANTAL 500Gr', 'Satuan: PCS', @cat_saus, 6311, 7000, 6750, 6750, 100, 1),
(UUID(), 'MCL-ORI-MAY-1KG', 'MC LEWIS ORIGINAL MAYO 1Kg', 'Satuan: PCS', @cat_saus, 22850, 24000, 23750, 23500, 100, 1),
(UUID(), 'MCL-SWT-MAY-1KG', 'MC LEWIS SWEET MAYO 1Kg', 'Satuan: PCS', @cat_saus, 20394, 22500, 22000, 21750, 100, 1),
(UUID(), 'MCL-ORI-MAY-500', 'MC LEWIS ORIGINAL MAYO 500Gr', 'Satuan: PCS', @cat_saus, 10925, 12500, 12000, 11500, 100, 1),
(UUID(), 'MCL-SWT-MAY-500', 'MC LEWIS SWEET MAYO 500Gr', 'Satuan: PCS', @cat_saus, 10618, 12000, 11500, 11250, 100, 1),
(UUID(), 'MCL-SWT-MAY-250', 'MC LEWIS SWEET MAYO 250Gr', 'Satuan: PCS', @cat_saus, 7400, 8500, 8250, 8000, 100, 1),
(UUID(), 'MCL-CHE-250', 'MC LEWIS CHEESE 250Gr', 'Satuan: PCS', @cat_saus, 13528, 15000, 14500, 14000, 100, 1),
(UUID(), 'MCL-BBQ-310', 'MC LEWIS BBQ 310Gr', 'Satuan: PCS', @cat_saus, 9960, 11500, 11000, 1100, 100, 1), -- Typo in price grosir image (1100)? Assuming 11000 based on others.
(UUID(), 'MCL-SPG-310', 'MC LEWIS SPAGHETTI 310Gr', 'Satuan: PCS', @cat_saus, 9960, 11500, 11000, 1100, 100, 1), -- Typo in price grosir image (1100)? Assuming 11000.
(UUID(), 'MAM-SAO-KEJ', 'MAMAYO SAOS KEJU', 'Satuan: PCS', @cat_saus, 20235, 23000, 22500, 22000, 100, 1),
(UUID(), 'SAM-MAH-PTH-SCH', 'SAMBAL MAHKOTA PTH SACHET', 'Satuan: PCS', @cat_saus, 3500, 4500, 4250, 4000, 100, 1),
(UUID(), 'SAM-MAH-KNG-SCH', 'SAMBAL MAHKOTA KNG SACHET', 'Satuan: PCS', @cat_saus, 3500, 4500, 4250, 4000, 100, 1),

-- MINYAK
(UUID(), 'MYK-SAN-1.8', 'MINYAK GORENG SANIA 1.8 LITER', 'Satuan: PCS', @cat_minyak, 35149, 37000, 36500, 36250, 100, 1),
(UUID(), 'MYK-RIZ-400', 'MINYAK GORENG RIZKI 400ML', 'Satuan: PCS', @cat_minyak, 8451, 10000, 9400, 9000, 100, 1),
(UUID(), 'MYK-WIJ-SAN', 'MINYAK WIJEN SANIA ROYALE', 'Satuan: PCS', @cat_minyak, 29000, 33000, 32000, 31000, 100, 1),

-- PUDING
(UUID(), 'HAP-PUD-COK', 'HAPPY PUDING COKLAT', 'Satuan: PCS', @cat_puding, 4489, 5000, 4750, 4750, 100, 1),
(UUID(), 'HAP-PUD-BUA', 'HAPPY PUDING RASA BUAH', 'Satuan: PCS', @cat_puding, 4489, 5000, 4750, 4750, 100, 1),
(UUID(), 'PUD-SEV-COK', 'PUDING SEVEN COKLAT', 'Satuan: PCS', @cat_puding, 4624, 5000, 4750, 4750, 100, 1),
(UUID(), 'PUD-SEV-BUA', 'PUDING SEVEN RASA BUAH', 'Satuan: PCS', @cat_puding, 4201, 5000, 4750, 4500, 100, 1),
(UUID(), 'PUD-SIL-POU', 'PUDING SILKY POUCH', 'Satuan: PCS', @cat_puding, 8843, 10000, 9500, 9250, 100, 1),
(UUID(), 'PUD-SIL-DUS', 'PUDING SILKY dus', 'Satuan: PCS', @cat_puding, 11300, 15000, 14000, 13000, 100, 1),
(UUID(), 'PUD-SUS-BUA', 'PUDING SUSU RASA BUAH', 'Satuan: PCS', @cat_puding, 8776, 10000, 9500, 9250, 100, 1),
(UUID(), 'PUD-SUS-COK', 'PUDING SUSU COKLAT', 'Satuan: PCS', @cat_puding, 9039, 10000, 9500, 9250, 100, 1),

-- AGAR
(UUID(), 'AGA-RAS-COK', 'AGARASA COKLAT', 'Satuan: PCS', @cat_agar, 4477, 5000, 4750, 4750, 100, 1),
(UUID(), 'AGA-RAS-BUA', 'AGARASA BUAH', 'Satuan: PCS', @cat_agar, 3803, 5000, 4750, 4500, 100, 1),
(UUID(), 'AGA-RIA', 'AGARIA C/M/H/P', 'Satuan: PCS', @cat_agar, 3500, 4500, 4250, 4000, 100, 1),
(UUID(), 'AGA-AKO', 'AKOS C/M/H/P', 'Satuan: PCS', @cat_agar, 4208, 5000, 4500, 4417, 100, 1),

-- JELLY / VLA
(UUID(), 'NUT-COK-BSR', 'NUTRIJEL COKLAT/BELGIAN BESAR', 'Satuan: PCS', @cat_jelly, 5414, 6000, 5750, 5600, 100, 1),
(UUID(), 'NUT-BUA-BSR', 'NUTRIJEL RASA BUAH BESAR', 'Satuan: PCS', @cat_jelly, 4577, 5000, 4800, 4750, 100, 1),
(UUID(), 'NUT-COK-KCL', 'NUTRIJEL COKLAT/BELGIAN KECIL', 'Satuan: PCS', @cat_jelly, 2544, 3000, 2750, 2667, 100, 1),
(UUID(), 'NUT-BUA-KCL', 'NUTRIJEL RASA BUAH KECIL', 'Satuan: PCS', @cat_jelly, 1746, 2500, 2000, 1833, 100, 1),
(UUID(), 'SIJ-MAN-COK', 'SI JELLY MANIS COKLAT', 'Satuan: PCS', @cat_jelly, 1667, 2500, 2000, 1833, 100, 1),
(UUID(), 'SIJ-MAN-RSA', 'SI JELLY MANIS RASA', 'Satuan: PCS', @cat_jelly, 1583, 2500, 2000, 1833, 100, 1),
(UUID(), 'MY-VLA', 'MY VLA all variant', 'Satuan: PCS', @cat_vla, 4703, 5500, 5000, 5000, 100, 1);
-- SQL Script to Import Batch 7 Products
-- Run this AFTER insert_products_batch6.sql
-- This script ADDS data.

-- 1. Create New Categories
INSERT IGNORE INTO categories (name, slug, icon) VALUES 
('BUBUK MINUMAN', 'bubuk-minuman', 'coffee'),
('WHIP CREAM', 'whip-cream', 'icecream'),
('TEPUNG PREMIX', 'tepung-premix', 'cake'), -- TP. PREMIX
('PASTA', 'pasta', 'format_color_fill'),
('PEWARNA', 'pewarna', 'palette'),
('BAHAN KUE', 'bahan-kue', 'kitchen'), -- KUPU2, VANILI, PENGEMBANG, LAIN LAIN mapped here
('COKLAT BUBUK', 'coklat-bubuk', 'cookie'),
('TOPPING', 'topping', 'star'),
('KACANG', 'kacang', 'spa'), -- Nuts/Seeds
('CREAMER', 'creamer', 'science'),
('BUMBU', 'bumbu', 'restaurant_menu');

-- 2. Helper to get category IDs
SET @cat_bubuk_min = (SELECT id FROM categories WHERE name = 'BUBUK MINUMAN');
SET @cat_whip = (SELECT id FROM categories WHERE name = 'WHIP CREAM');
SET @cat_premix = (SELECT id FROM categories WHERE name = 'TEPUNG PREMIX');
SET @cat_pasta = (SELECT id FROM categories WHERE name = 'PASTA');
SET @cat_pewarna = (SELECT id FROM categories WHERE name = 'PEWARNA');
SET @cat_bahan_kue = (SELECT id FROM categories WHERE name = 'BAHAN KUE');
SET @cat_coklat_bubuk = (SELECT id FROM categories WHERE name = 'COKLAT BUBUK');
SET @cat_topping = (SELECT id FROM categories WHERE name = 'TOPPING');
SET @cat_kacang = (SELECT id FROM categories WHERE name = 'KACANG');
SET @cat_creamer = (SELECT id FROM categories WHERE name = 'CREAMER');
SET @cat_bumbu = (SELECT id FROM categories WHERE name = 'BUMBU');

-- 3. Insert Batch 7 Products
INSERT INTO products (id, sku, name, description, category_id, purchase_price, price, price_reseller, price_grosir, stock_quantity, is_active) VALUES
-- BUBUK MINUMAN
(UUID(), 'OMU-BLD-DUR-1KG', 'OMURA BLEND DURIAN 1KG', 'Satuan: PCS', @cat_bubuk_min, 45000, 50000, 50000, 50000, 100, 1),
(UUID(), 'OMU-BLD-MAN-1KG', 'OMURA BLEND MANGGA 1KG', 'Satuan: PCS', @cat_bubuk_min, 45000, 50000, 50000, 50000, 100, 1),
(UUID(), 'FRO-POP-CAP-500', 'FROZZY POP CAPPUCINO 500GR', 'Satuan: PCS', @cat_bubuk_min, 22500, 25000, 25000, 25000, 100, 1),
(UUID(), 'FRO-POP-COK-500', 'FROZZY POP COKLAT 500GR', 'Satuan: PCS', @cat_bubuk_min, 22500, 25000, 25000, 25000, 100, 1),

-- WHIP CREAM
(UUID(), 'PON-WHI-CRM-100', 'PONDAN WHIPPING CREAM 100GR', 'Satuan: PCS', @cat_whip, 15540, 17500, 17000, 16750, 100, 1),
(UUID(), 'HAI-WHI-CRM-300', 'HAIS WHIPPING CREAM 300GR', 'Satuan: PCS', @cat_whip, 27000, 32000, 31000, 30000, 100, 1),

-- TEPUNG PREMIX
(UUID(), 'TEP-DON-250', 'TEPUNG DONAT 250GR', 'Satuan: PCS', @cat_premix, 11000, 15000, 14000, 13500, 100, 1), -- Price jump is large, copied as is.
(UUID(), 'PON-BRO-KUK', 'PONDAN BROWNIS KUKUS', 'Satuan: PCS', @cat_premix, 27500, 32000, 31000, 30000, 100, 1),
(UUID(), 'PON-BF-KUK', 'PONDAN BLACK FOREST KUKUS', 'Satuan: PCS', @cat_premix, 28000, 32000, 31000, 30000, 100, 1),
(UUID(), 'PON-BF-PANG', 'PONDAN BLACK FOREST PANGGANG', 'Satuan: PCS', @cat_premix, 28500, 32000, 31000, 30000, 100, 1),
(UUID(), 'PON-SPO-CAK-COK', 'PONDAN SPONGE CAKE MIX COKLAT', 'Satuan: PCS', @cat_premix, 26000, 32000, 31000, 30000, 100, 1),
(UUID(), 'PON-SPO-CAK-VAN', 'PONDAN SPONGE CAKE MIX VANILA', 'Satuan: PCS', @cat_premix, 26000, 30000, 29000, 28000, 100, 1),
(UUID(), 'NUT-BRO-COK', 'NUTRICAKE BROWNIES COKLAT', 'Satuan: PCS', @cat_premix, 12500, 13500, 13250, 13000, 100, 1),

-- PASTA
(UUID(), 'BLA-BF', 'BLACKTON BLACK FOREST', 'Satuan: PCS', @cat_pasta, 18000, 22000, 21000, 20000, 100, 1),
(UUID(), 'PAS-RED-60', 'PASTA REDBELL 60ML', 'Satuan: PCS', @cat_pasta, 5250, 8500, 8000, 7000, 100, 1),
(UUID(), 'PAS-PTH-RED', 'PASTA PUTIH REDBELL', 'Satuan: PCS', @cat_pasta, 5167, 7000, 6500, 5000, 100, 1),
(UUID(), 'PAS-KUP-60', 'PASTA CAP KUPU 60ML', 'Satuan: PCS', @cat_pasta, 7309, 8500, 8000, 7750, 100, 1),

-- PEWARNA
(UUID(), 'PEW-KUP-30', 'PEWARNA CAP KUPU 30ML', 'Satuan: PCS', @cat_pewarna, 3500, 5000, 4750, 4500, 100, 1),
(UUID(), 'PEW-RAJ-30', 'PEWARNA RAJAWALI 30ML', 'Satuan: PCS', @cat_pewarna, 3500, 5000, 4750, 4500, 100, 1),
(UUID(), 'PEW-KUP-PIN-30', 'PEWARNA KUPU PINK/HITAM 30ML', 'Satuan: PCS', @cat_pewarna, 4450, 5000, 5000, 5000, 100, 1),

-- BAHAN KUE (KUPU2, VANILI, LAIN LAIN)
(UUID(), 'VAN-CRY-KUP', 'VANILI CRYSTAL KUPU', 'Satuan: PCS', @cat_bahan_kue, 6378, 8000, 7500, 7000, 100, 1),
(UUID(), 'TBM-KUP', 'TBM KUPU', 'Satuan: PCS', @cat_bahan_kue, 6778, 8500, 8000, 7500, 100, 1),
(UUID(), 'OVA-KUP', 'OVALET KUPU', 'Satuan: PCS', @cat_bahan_kue, 6778, 8500, 8000, 7500, 100, 1),
(UUID(), 'SP-KUP', 'SP KUPU', 'Satuan: PCS', @cat_bahan_kue, 7064, 8500, 8000, 7750, 100, 1),
(UUID(), 'SOD-KUE-KUP', 'SODA KUE KUPU', 'Satuan: PCS', @cat_bahan_kue, 4342, 6000, 5500, 5000, 100, 1),
(UUID(), 'BAK-POW-KUP', 'BAKING POWDER KUPU', 'Satuan: PCS', @cat_bahan_kue, 5165, 7000, 6500, 6000, 100, 1),
(UUID(), 'PAR-KUP', 'PARSLEY KUPU', 'Satuan: PCS', @cat_bahan_kue, 5358, 9000, 8500, 8000, 100, 1),
(UUID(), 'ORE-KUP', 'OREGANO KUPU', 'Satuan: PCS', @cat_bahan_kue, 5358, 9000, 8500, 8000, 100, 1),
(UUID(), 'PUT-KUP', 'PUTIH KUPU', 'Satuan: PCS', @cat_bahan_kue, 9650, 12000, 11500, 11000, 100, 1),
(UUID(), 'BAK-POW-DYN-50', 'BAKING POWDER DYNA 50GR', 'Satuan: PCS', @cat_bahan_kue, 2500, 5000, 5000, 4500, 100, 1),
(UUID(), 'BAK-POW-DYN-250', 'BAKING POWDER DYNA 250GR', 'Satuan: PCS', @cat_bahan_kue, 10250, 15000, 14500, 14000, 100, 1),
(UUID(), 'BUM-SPE', 'BUMBU SPEKOEK', 'Satuan: PCS', @cat_bahan_kue, 5000, 10000, 9000, 8500, 100, 1),
(UUID(), 'VAN-G-BOX', 'VANILI G BOX', 'Satuan: PCS', @cat_bahan_kue, 9500, 12000, 11500, 11000, 100, 1),
(UUID(), 'VAN-G-SAC', 'VANILI G SACHET', 'Satuan: PCS', @cat_bahan_kue, 100, 350, 350, 350, 100, 1),
(UUID(), 'CHE-TAN', 'CHERRY TANGKAI', 'Satuan: PCS', @cat_bahan_kue, 1500, 2500, 2250, 2000, 100, 1),
(UUID(), 'SAN-KAR', 'SANTAN KARA', 'Satuan: PCS', @cat_bahan_kue, 4464, 5500, 5250, 5100, 100, 1),
(UUID(), 'HUN-KWE', 'HUN KWEE', 'Satuan: PCS', @cat_bahan_kue, 1000, 2000, 1800, 1500, 100, 1),

-- COKLAT BUBUK
(UUID(), 'WIN-MOL-40', 'WIN MOLEN COCOA POWDER 40GR', 'Satuan: PCS', @cat_coklat_bubuk, 8247, 12500, 12000, 11500, 100, 1),
(UUID(), 'WIN-MOL-80', 'WIN MOLEN COCOA POWDER 80GR', 'Satuan: PCS', @cat_coklat_bubuk, 13765, 17500, 17000, 17000, 100, 1),
(UUID(), 'VAN-COC-40', 'VANHOUTEN COCOA POWDER 40GR', 'Satuan: PCS', @cat_coklat_bubuk, 18000, 22500, 22000, 21500, 100, 1),
(UUID(), 'VAN-COC-80', 'VANHOUTEN COCOA POWDER 80GR', 'Satuan: PCS', @cat_coklat_bubuk, 23776, 27500, 27000, 26500, 100, 1),
(UUID(), 'COK-SUL-50', 'COKLAT SULTAN 50GR', 'Satuan: PCS', @cat_coklat_bubuk, 7000, 15000, 14000, 14000, 100, 1),
(UUID(), 'COK-SUL-100', 'COKLAT SULTAN 100GR', 'Satuan: PCS', @cat_coklat_bubuk, 14000, 25000, 24000, 22500, 100, 1),
(UUID(), 'COK-BLO-50', 'COKLAT BLOCK 50GR', 'Satuan: PCS', @cat_coklat_bubuk, 4000, 15000, 14000, 13000, 100, 1),
(UUID(), 'COK-BLO-100', 'COKLAT BLOCK 100GR', 'Satuan: PCS', @cat_coklat_bubuk, 8000, 25000, 24000, 23000, 100, 1),
(UUID(), 'COK-BUB-MIN-50', 'COKLAT BUBUK MINI 50GR', 'Satuan: PCS', @cat_coklat_bubuk, 1300, 3500, 3000, 2500, 100, 1),
(UUID(), 'COK-BUB-MIN-250', 'COKLAT BUBUK MINI 250GR', 'Satuan: PCS', @cat_coklat_bubuk, 5500, 12000, 11500, 11000, 100, 1),
(UUID(), 'COK-BUB-MAN-250', 'COKLAT BUBUK MANIS 250Gr', 'Satuan: PCS', @cat_coklat_bubuk, 4200, 6000, 5600, 5250, 100, 1),

-- TOPPING
(UUID(), 'CHO-BAL-CUP', 'CHOCO BALL CUP', 'Satuan: PCS', @cat_topping, 5500, 7500, 7250, 7000, 100, 1),
(UUID(), 'CHO-BAL-1KG', 'CHOCO BALL 1KG', 'Satuan: PCS', @cat_topping, 74131, 90000, 87000, 85000, 100, 1),
(UUID(), 'COK-KER-CUP', 'COKLAT KERIKIL CUP', 'Satuan: PCS', @cat_topping, 3290, 5000, 4750, 4500, 100, 1),
(UUID(), 'CHO-CHI-COK-250', 'CHOCOCHIPS COKLAT 250GR', 'Satuan: PCS', @cat_topping, 16900, 22000, 21500, 21000, 100, 1),
(UUID(), 'CHO-CHI-COK-50', 'CHOCOCHIPS COKLAT 50GR', 'Satuan: PCS', @cat_topping, 3380, 5000, 4750, 4500, 100, 1),
(UUID(), 'CHO-CHI-WAR-250', 'CHOCOCHIPS WARNA 250GR', 'Satuan: PCS', @cat_topping, 16900, 22000, 21500, 21000, 100, 1),
(UUID(), 'CHO-CHI-WAR-50', 'CHOCOCHIPS WARNA 50GR', 'Satuan: PCS', @cat_topping, 3380, 5000, 4750, 4500, 100, 1),
(UUID(), 'MIL-CUB-CUP', 'MILO CUBE CUP', 'Satuan: PCS', @cat_topping, 4250, 7500, 7250, 7000, 100, 1),
(UUID(), 'MIL-CUB-POU', 'MILO CUBE POUCH', 'Satuan: PCS', @cat_topping, 10400, 15000, 15000, 15000, 100, 1),
(UUID(), 'SPR-CUP', 'SPRINKLE CUP', 'Satuan: PCS', @cat_topping, 2500, 5000, 4750, 4500, 100, 1),
(UUID(), 'SPR-250', 'SPRINKLE 250Gr', 'Satuan: PCS', @cat_topping, 14500, 23000, 22000, 21000, 100, 1),
(UUID(), 'SPR-MIX-GOL-SIL', 'SPRINKLE MIX GOLD/SILVER', 'Satuan: PCS', @cat_topping, 6000, 10000, 10000, 10000, 100, 1),
(UUID(), 'SPR-MIX-WAR', 'SPRINKLE MIX WARNA', 'Satuan: PCS', @cat_topping, 4000, 8000, 8000, 8000, 100, 1),
(UUID(), 'ORE-CRU-KAS-1KG', 'OREO CRUMBLE KASAR 1KG', 'Satuan: PCS', @cat_topping, 22000, 60000, 57000, 55000, 100, 1),
(UUID(), 'ORE-CRU-KAS-200', 'OREO CRUMBLE KASAR 200GR', 'Satuan: PCS', @cat_topping, 6400, 12000, 11500, 11000, 100, 1),
(UUID(), 'RED-VEL-CRU-1KG', 'RED VELVET CRUMBLE 1KG', 'Satuan: PCS', @cat_topping, 51000, 60000, 59000, 58000, 100, 1),
(UUID(), 'RED-VEL-CRU-250', 'RED VELVET CRUMBLE 250GR', 'Satuan: PCS', @cat_topping, 12750, 17000, 16500, 16000, 100, 1),
(UUID(), 'GRE-TEA-CRU-250', 'GREEN TEA CRUMBLE 250GR', 'Satuan: PCS', @cat_topping, 12750, 17000, 16500, 16000, 100, 1),
(UUID(), 'GRE-TEA-CRU-1KG', 'GREEN TEA CRUMBLE 1KG', 'Satuan: PCS', @cat_topping, 51000, 60000, 59000, 58000, 100, 1),
(UUID(), 'BRE-CRU-500', 'BREAD CRUMB 500Gr', 'Satuan: PCS', @cat_topping, 7700, 9500, 9250, 9000, 100, 1),
(UUID(), 'BRE-CRU-250', 'BREAD CRUMB 250Gr', 'Satuan: PCS', @cat_topping, 3850, 5000, 4750, 4500, 100, 1),
(UUID(), 'BRE-CRU-SAK', 'BREAD CRUMB SAK 10Kg', 'Satuan: PCS', @cat_topping, 154000, 170000, 168000, 165000, 100, 1),

-- TOPPING (ABON)
(UUID(), 'ABO-BAG-250', 'ABON BAGUS 250GR', 'Satuan: PCS', @cat_topping, 35000, 50000, 50000, 50000, 100, 1),
(UUID(), 'ABO-BAG-100', 'ABON BAGUS 100GR', 'Satuan: PCS', @cat_topping, 14000, 20000, 20000, 20000, 100, 1),
(UUID(), 'ABO-SEM-1KG', 'ABON SEMAR 1KG', 'Satuan: PCS', @cat_topping, 40000, 65000, 65000, 65000, 100, 1),
(UUID(), 'ABO-SEM-250', 'ABON SEMAR 250GR', 'Satuan: PCS', @cat_topping, 10000, 15000, 15000, 15000, 100, 1),
(UUID(), 'ABO-SEM-100', 'ABON SEMAR 100GR', 'Satuan: PCS', @cat_topping, 4000, 7000, 7000, 7000, 100, 1),

-- KACANG / NUTS
(UUID(), 'KCG-HIJ-KPS-250', 'KACANG HIJAU KUPAS 250GR', 'Satuan: PCS', @cat_kacang, 7250, 9000, 8750, 8500, 100, 1),
(UUID(), 'KCG-HIJ-KPS-1KG', 'KACANG HIJAU KUPAS 1KG', 'Satuan: PCS', @cat_kacang, 29000, 36000, 35000, 34000, 100, 1),
(UUID(), 'WIJ-100', 'WIJEN 100GR', 'Satuan: PCS', @cat_kacang, 4000, 6000, 5750, 5500, 100, 1),
(UUID(), 'WIJ-250', 'WIJEN 250GR', 'Satuan: PCS', @cat_kacang, 10000, 12000, 12000, 12000, 100, 1),
(UUID(), 'WIJ-500', 'WIJEN 500GR', 'Satuan: PCS', @cat_kacang, 20000, 24000, 23000, 22500, 100, 1),
(UUID(), 'WIJ-1KG', 'WIJEN 1KG', 'Satuan: PCS', @cat_kacang, 40000, 45000, 44500, 44000, 100, 1),
(UUID(), 'KCG-ALM-CUP', 'KACANG ALMOND SLICE CUP', 'Satuan: PCS', @cat_kacang, 5000, 10000, 9000, 8500, 100, 1),
(UUID(), 'KCG-ALM-POU', 'KACANG ALMOND SLICE POUCH', 'Satuan: PCS', @cat_kacang, 15000, 20000, 19500, 19000, 100, 1),
(UUID(), 'KCG-ALM-250', 'KACANG ALMOND SLICE 250GR', 'Satuan: PCS', @cat_kacang, 60000, 75000, 72000, 70000, 100, 1),
(UUID(), 'KCG-CAC-1KG', 'KACANG CACAH 1KG', 'Satuan: PCS', @cat_kacang, 45000, 55000, 52500, 51000, 100, 1),
(UUID(), 'KCG-CAC-250', 'KACANG CACAH 250GR', 'Satuan: PCS', @cat_kacang, 11250, 15000, 14500, 14000, 100, 1),
(UUID(), 'KCG-CAC-100', 'KACANG CACAH 100GR', 'Satuan: PCS', @cat_kacang, 4500, 7500, 7250, 7000, 100, 1),
(UUID(), 'BIJ-SEL-CUP', 'BIJI SELASIH CUP', 'Satuan: PCS', @cat_kacang, 2500, 5000, 4750, 4500, 100, 1),
(UUID(), 'BIJ-SEL-1KG', 'BIJI SELASIH 1KG', 'Satuan: PCS', @cat_kacang, 70000, 90000, 88000, 85000, 100, 1),

-- PENGEMBANG
(UUID(), 'SP-QUI-40', 'SP/QUICK 40GR', 'Satuan: PCS', @cat_bahan_kue, 1720, 4000, 3750, 3500, 100, 1),
(UUID(), 'SP-QUI-100', 'SP/QUICK 100GR', 'Satuan: PCS', @cat_bahan_kue, 4300, 8000, 7500, 7000, 100, 1),
(UUID(), 'SP-QUI-250', 'SP/QUICK 250GR', 'Satuan: PCS', @cat_bahan_kue, 10750, 20000, 18000, 17000, 100, 1),
(UUID(), 'BIB-ROT-ANG', 'BIBIT ROTI ANGEL 500Gr', 'Satuan: PCS', @cat_bahan_kue, 30000, 35000, 34500, 34000, 100, 1),
(UUID(), 'BIB-ROT-CUR', 'BIBIT ROTI CURAH 50Gr', 'Satuan: PCS', @cat_bahan_kue, 3000, 5000, 4750, 4500, 100, 1),
(UUID(), 'BAK-PLU-500', 'BAKERINE PLUS 500GR', 'Satuan: PCS', @cat_bahan_kue, 45000, 50000, 49500, 49000, 100, 1),
(UUID(), 'BAK-PLU-50', 'BAKERINE PLUS 50GR', 'Satuan: PCS', @cat_bahan_kue, 4500, 7000, 6500, 6000, 100, 1),
(UUID(), 'FER-SCH', 'FERMIPAN SACHET', 'Satuan: PCS', @cat_bahan_kue, 4250, 5000, 4750, 4600, 100, 1),
(UUID(), 'MAU-SCH', 'MAURIPAN SACHET', 'Satuan: PCS', @cat_bahan_kue, 4250, 5000, 4750, 4650, 100, 1),

-- CREAMER
(UUID(), 'CRE-250', 'CREAMER 250GR', 'Satuan: PCS', @cat_creamer, 7500, 11000, 10500, 10000, 100, 1),
(UUID(), 'CRE-500', 'CREAMER 500GR', 'Satuan: PCS', @cat_creamer, 15000, 20000, 19500, 19000, 100, 1),
(UUID(), 'CRE-1KG', 'CREAMER 1KG', 'Satuan: PCS', @cat_creamer, 30000, 40000, 39000, 38000, 100, 1),

-- BUMBU
(UUID(), 'ANT-BUM-TAB', 'ANTAKA BUMBU TABUR', 'Satuan: PCS', @cat_bumbu, 5000, 5500, 5400, 5250, 100, 1),
(UUID(), 'AID-CAB-BUB', 'AIDA CABE BUBUK', 'Satuan: PCS', @cat_bumbu, 1600, 2500, 2000, 2000, 100, 1),
(UUID(), 'BUM-ASI-250', 'BUMBU ASIN 250GR', 'Satuan: PCS', @cat_bumbu, 16000, 20000, 20000, 20000, 100, 1),
(UUID(), 'BUM-RAC', 'BUMBU RACIK', 'Satuan: PCS', @cat_bumbu, 1700, 2000, 2000, 2000, 100, 1),
(UUID(), 'DAP-AYA-GOR', 'DAPURKU BUMBU AYAM GORENG KRISPI', 'Satuan: PCS', @cat_bumbu, 1700, 2000, 2000, 2000, 100, 1),
(UUID(), 'DAP-KAY-MAN', 'DAPURKU KAYU MANIS BUBUK', 'Satuan: PCS', @cat_bumbu, 380, 500, 500, 500, 100, 1),
(UUID(), 'DAP-PAL-BUB', 'DAPURKU PALA BUBUK', 'Satuan: PCS', @cat_bumbu, 380, 500, 500, 500, 100, 1),
(UUID(), 'DAP-KAL-JAM', 'DAPURKU KALDU JAMUR', 'Satuan: PCS', @cat_bumbu, 800, 1000, 1000, 1000, 100, 1),
(UUID(), 'DAP-LAD-BUB', 'DAPURKU LADA BUBUK', 'Satuan: PCS', @cat_bumbu, 380, 500, 500, 500, 100, 1),
(UUID(), 'DAP-BWG-PTH', 'DAPURKU BAWANG PUTIH BUBUK', 'Satuan: PCS', @cat_bumbu, 380, 500, 500, 500, 100, 1);
