#!/bin/bash
# ==============================================================
# Laksana POS - Script Deploy & Update Otomatis untuk Server Linux
# ==============================================================

set -e

echo -e "\033[1;36m========================================================\033[0m"
echo -e "\033[1;36m       LAKSANA POS - ONE-COMMAND PRODUCTION DEPLOY      \033[0m"
echo -e "\033[1;36m========================================================\033[0m"

# Pastikan berada di root project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "\n\033[1;33m[1/5] Mengambil update terbaru dari GitHub...\033[0m"
git pull origin main

echo -e "\n\033[1;33m[2/5] Membangun Frontend (Production Build)...\033[0m"
cd "$ROOT_DIR"
if command -v pnpm &> /dev/null; then
    pnpm install || pnpm install --no-frozen-lockfile
    pnpm --filter admin-dashboard build
elif command -v npm &> /dev/null; then
    cd "$ROOT_DIR/apps/admin-dashboard"
    npm install
    npm run build
else
    echo -e "\033[31m[ERROR] pnpm atau npm tidak ditemukan. Silakan pasang Node.js & pnpm terlebih dahulu.\033[0m"
    exit 1
fi
echo -e "\033[32m✓ Frontend berhasil di-compile ke folder dist/\033[0m"

echo -e "\n\033[1;33m[3/5] Memeriksa dependensi Backend (PHP Composer)...\033[0m"
cd "$ROOT_DIR/apps/api"
if [ ! -d "vendor" ]; then
    if command -v composer &> /dev/null; then
        composer install --no-dev --optimize-autoloader
        echo -e "\033[32m✓ Dependensi Composer berhasil dipasang.\033[0m"
    else
        echo -e "\033[33m[WARN] Composer tidak ditemukan. Pastikan folder vendor sudah tersedia.\033[0m"
    fi
fi

echo -e "\n\033[1;33m[4/5] Menjalankan Migrasi Database...\033[0m"
php "$ROOT_DIR/apps/api/migrate.php"

echo -e "\n\033[1;33m[5/5] Mengatur Permission Folder Uploads & Storage...\033[0m"
mkdir -p "$ROOT_DIR/apps/api/public/uploads"
mkdir -p "$ROOT_DIR/apps/api/public/storage/receipts"
chmod -R 775 "$ROOT_DIR/apps/api/public/uploads"
chmod -R 775 "$ROOT_DIR/apps/api/public/storage"

# Jika dijalankan dengan sudo, beri akses ke www-data
if [ "$EUID" -eq 0 ]; then
    chown -R www-data:www-data "$ROOT_DIR/apps/api/public/uploads"
    chown -R www-data:www-data "$ROOT_DIR/apps/api/public/storage"
    
    # Reload Nginx jika aktif
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        echo -e "\033[32m✓ Nginx berhasil di-reload.\033[0m"
    fi
fi

echo -e "\n\033[1;32m========================================================\033[0m"
echo -e "\033[1;32m      ✓ DEPLOYMENT LAKSANA POS SELESAI DENGAN SUKSES!   \033[0m"
echo -e "\033[1;32m========================================================\033[0m\n"
