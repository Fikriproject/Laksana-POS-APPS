-- Reset admin user dengan password hash yang benar
-- password: admin123
DELETE FROM users WHERE username = 'admin' OR username = 'cashier1';

INSERT INTO users (id, username, employee_id, password_hash, pin_code, full_name, email, role, is_active) VALUES 
('c2bc802f-508b-4a57-8974-9892c5890001', 'admin', 'EMP001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Administrator', 'admin@pos.local', 'admin', 1),
('c2bc802f-508b-4a57-8974-9892c5890002', 'cashier1', 'EMP002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1234', 'Kasir Utama', 'kasir@pos.local', 'cashier', 1);
