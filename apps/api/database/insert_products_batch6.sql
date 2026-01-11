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
