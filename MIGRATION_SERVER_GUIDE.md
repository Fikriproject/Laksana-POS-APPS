# 🚀 Panduan Migrasi Database Laksana POS ke Server

Panduan ini memudahkan sinkronisasi dan migrasi database ke server (VPS, Railway, Supabase, Neon, cPanel, Docker) hanya dengan **1 perintah**.

---

## ⚡ 1 Perintah Migrasi (Otomatis)

Skrip migrasi telah mendukung **MySQL** dan **PostgreSQL** secara otomatis (auto-detect driver).

### Opsi A: Dari Folder Utama (Root)
Jika Anda berada di root project di server:
```bash
php apps/api/migrate.php
```
*Atau jika menggunakan pnpm:*
```bash
pnpm migrate
```
*Atau jika di Linux:*
```bash
chmod +x migrate.sh
./migrate.sh
```
*Atau jika di Windows:*
Double-click file `migrate.bat`

---

### Opsi B: Dari Dalam Folder `apps/api`
Jika Anda sedang berada di dalam folder `apps/api`:
```bash
php migrate.php
```
*Atau:*
```bash
composer migrate
```

---

## ⚙️ Konfigurasi Environment (`.env`) di Server

Pastikan file `.env` di `apps/api/.env` (atau di root) sudah terkonfigurasi:

### Jika Menggunakan PostgreSQL (Supabase / Railway / Neon / VPS Postgres):
Cukup isi salah satu:
```env
# Format Connection String (Supabase / Railway)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# ATAU Format Parameter Terpisah
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pos_cashier
DB_USER=postgres
DB_PASSWORD=rahasia
DB_SSL_MODE=require
```

### Jika Menggunakan MySQL / MariaDB (cPanel / XAMPP / VPS MySQL):
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pos_cashier
DB_USER=root
DB_PASSWORD=
```

---

## 📋 Parameter Perintah Tambahan

| Perintah | Deskripsi |
|---|---|
| `php apps/api/migrate.php` | Migrasi aman: Buat tabel & kolom baru yang belum ada tanpa menghapus data yang sudah ada |
| `php apps/api/migrate.php --seed` | Migrasi sekaligus menambahkan data sampel produk & kategori |
| `php apps/api/migrate.php --fresh` | Reset total: Hapus semua tabel lalu buat ulang dari awal (akan meminta konfirmasi `yes`) |
| `php apps/api/migrate.php --fresh --force` | Reset total langsung tanpa konfirmasi |
| `php apps/api/migrate.php --status` | Cek status koneksi dan tabel database |

---

## 🌐 Migrasi via Web Browser (Khusus Hosting Tanpa Akses SSH/Terminal)

Jika server Anda tidak memiliki akses terminal SSH (seperti shared hosting / cPanel biasa):
1. Pastikan file terupload ke server.
2. Buka browser dan akses URL:
   ```
   https://api-domain-anda.com/migrate.php?secret=laksana_pos_migrate_secret
   ```
   *(Secret dapat diubah di `.env` dengan variabel `MIGRATION_SECRET=password_rahasia_anda`)*.

---

## 📂 File SQL Lengkap (Untuk phpMyAdmin / Supabase SQL Editor / DBeaver)

Jika Anda lebih suka menjalankan query SQL langsung di dashboard database:
- **MySQL / MariaDB**: `apps/api/database/schema_mysql.sql`
- **PostgreSQL / Supabase**: `apps/api/database/schema_postgres.sql`

---

## 🔑 Akun Default Setelah Migrasi

- **Admin**:
  - Username: `admin`
  - Password: `admin123`
- **Kasir**:
  - Username: `cashier1`
  - PIN: `1234`
