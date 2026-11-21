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

# Pastikan timezone sistem server disetel ke Asia/Jakarta (WIB)
if command -v timedatectl &> /dev/null; then
    sudo timedatectl set-timezone Asia/Jakarta 2>/dev/null || timedatectl set-timezone Asia/Jakarta 2>/dev/null || true
fi

echo -e "\n\033[1;33m[2/5] Membangun Frontend (Production Build)...\033[0m"
cd "$ROOT_DIR"
BUILD_SUCCESS=0

# Pastikan folder dist tidak terkunci oleh kepemilikan root sebelumnya
if [ -d "$ROOT_DIR/apps/admin-dashboard/dist" ]; then
    if [ ! -w "$ROOT_DIR/apps/admin-dashboard/dist" ] || [ ! -w "$ROOT_DIR/apps/admin-dashboard/dist/assets" 2>/dev/null ]; then
        echo -e "\033[33m[WARN] Folder dist terkunci oleh izin root. Memperbaiki kepemilikan...\033[0m"
        sudo chown -R "$(whoami):$(whoami)" "$ROOT_DIR/apps/admin-dashboard" 2>/dev/null || sudo rm -rf "$ROOT_DIR/apps/admin-dashboard/dist" 2>/dev/null || true
    fi
fi

# Coba build langsung jika vite binary sudah ada
if [ -f "$ROOT_DIR/apps/admin-dashboard/node_modules/.bin/vite" ]; then
    if (cd "$ROOT_DIR/apps/admin-dashboard" && ./node_modules/.bin/vite build); then
        BUILD_SUCCESS=1
    fi
fi

# Coba build dengan npm (paling stabil & kompatibel)
if [ $BUILD_SUCCESS -eq 0 ] && command -v npm &> /dev/null; then
    cd "$ROOT_DIR/apps/admin-dashboard"
    # Jika node_modules tercampur symlink pnpm yang memicu error ENOTDIR, bersihkan terlebih dahulu
    if [ -L "node_modules/autoprefixer" ] || [ -L "node_modules/vite" ] || [ ! -f "node_modules/.bin/vite" ]; then
        echo -e "\033[33m[INFO] Membersihkan cache node_modules lama untuk menghindari bentrok pnpm/npm...\033[0m"
        rm -rf node_modules package-lock.json
    fi
    if (npm install && npm run build); then
        BUILD_SUCCESS=1
    elif npx vite build; then
        BUILD_SUCCESS=1
    fi
    cd "$ROOT_DIR"
fi

# Fallback ke pnpm dengan hoist
if [ $BUILD_SUCCESS -eq 0 ] && command -v pnpm &> /dev/null; then
    cd "$ROOT_DIR"
    pnpm install --shamefully-hoist || pnpm install
    if pnpm --filter admin-dashboard build; then
        BUILD_SUCCESS=1
    fi
fi

if [ $BUILD_SUCCESS -eq 0 ]; then
    echo -e "\033[31m[ERROR] Gagal melakukan build frontend. Silakan periksa instalasi Node.js & npm.\033[0m"
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
chmod -R 777 "$ROOT_DIR/apps/api/public/uploads"
chmod -R 777 "$ROOT_DIR/apps/api/public/storage"

# Jika dijalankan dengan sudo, beri akses ke www-data & perbarui Nginx
if [ "$EUID" -eq 0 ]; then
    chown -R www-data:www-data "$ROOT_DIR/apps/api/public/uploads"
    chown -R www-data:www-data "$ROOT_DIR/apps/api/public/storage"
    
    # Periksa dan perbarui konfigurasi Nginx jika file situs ditemukan
    for CONF_PATH in "/etc/nginx/sites-available/laksana-pos.conf" "/etc/nginx/sites-available/poslaksana.conf" "/etc/nginx/conf.d/laksana-pos.conf"; do
        if [ -f "$CONF_PATH" ]; then
            cp "$ROOT_DIR/nginx-laksana-pos.conf" "$CONF_PATH"
            echo -e "\033[32m✓ Konfigurasi Nginx ($CONF_PATH) berhasil diselaraskan.\033[0m"
            break
        fi
    done

    # Reload Nginx jika aktif
    if systemctl is-active --quiet nginx; then
        nginx -t 2>/dev/null && systemctl reload nginx
        echo -e "\033[32m✓ Nginx berhasil di-reload.\033[0m"
    fi
fi

echo -e "\n\033[1;32m========================================================\033[0m"
echo -e "\033[1;32m      ✓ DEPLOYMENT LAKSANA POS SELESAI DENGAN SUKSES!   \033[0m"
echo -e "\033[1;32m========================================================\033[0m\n"
