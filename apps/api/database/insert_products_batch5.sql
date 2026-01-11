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
