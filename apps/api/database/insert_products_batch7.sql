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
