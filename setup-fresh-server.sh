#!/bin/bash
# ==============================================================
# Laksana POS - Auto Setup & Restore Server Baru (Ubuntu 24.04)
# ==============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;36m'
NC='\033[0m'

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}    LAKSANA POS - FULL AUTOMATED SERVER RESTORATION     ${NC}"
echo -e "${BLUE}========================================================${NC}"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR] Harap jalankan script ini dengan sudo:${NC}"
    echo "  sudo bash setup-fresh-server.sh"
    exit 1
fi

TARGET_USER="fikri"
TARGET_DIR="/home/$TARGET_USER/Laksana-POS-APPS"

echo -e "\n${YELLOW}[1/10] Mengatur Boot EFI agar selalu booting otomatis ke Ubuntu...${NC}"
if command -v efibootmgr &> /dev/null; then
    UBUNTU_BOOT_NUM=$(efibootmgr | grep -i "ubuntu" | head -n 1 | awk '{print $1}' | sed 's/[^0-9]//g')
    if [ -n "$UBUNTU_BOOT_NUM" ]; then
        efibootmgr -o "$UBUNTU_BOOT_NUM" || true
        echo -e "${GREEN}✓ Boot order disetel otomatis ke Ubuntu ($UBUNTU_BOOT_NUM).${NC}"
    fi
fi

echo -e "\n${YELLOW}[2/10] Mengatur laptop agar tetap menyala 24/7 (Anti Sleep & Layar Ditutup)...${NC}"
systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target || true
sed -i 's/#*HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf || true
sed -i 's/#*HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf || true
systemctl restart systemd-logind || true
echo -e "${GREEN}✓ Pengaturan 24/7 laptop berhasil diterapkan.${NC}"

echo -e "\n${YELLOW}[3/10] Memperbarui repositori dan menginstall paket dasar...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git unzip software-properties-common fail2ban cockpit \
    nginx mysql-server \
    php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl php8.3-gd php8.3-intl php8.3-zip

systemctl enable --now nginx
systemctl enable --now mysql
systemctl enable --now php8.3-fpm

echo -e "\n${YELLOW}[4/10] Menginstall Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
npm install -g pnpm || true
echo -e "${GREEN}✓ Node.js & pnpm berhasil dipasang.${NC}"

echo -e "\n${YELLOW}[5/10] Menyiapkan Database MySQL (pos_cashier)...${NC}"
mysql -e "CREATE DATABASE IF NOT EXISTS pos_cashier CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH auth_socket;" || true
echo -e "${GREEN}✓ Database pos_cashier siap.${NC}"

echo -e "\n${YELLOW}[6/10] Mengunduh repository Laksana POS...${NC}"
if [ -d "$TARGET_DIR" ]; then
    echo "Folder $TARGET_DIR sudah ada, melakukan update..."
    cd "$TARGET_DIR"
    git fetch origin main
    git reset --hard origin/main
else
    echo "Melakukan clone dari GitHub..."
    git clone https://github.com/fikriproject/Laksana-POS-APPS.git "$TARGET_DIR"
fi
chown -R $TARGET_USER:$TARGET_USER "$TARGET_DIR"

echo -e "\n${YELLOW}[7/10] Membangun Frontend POS & Migrasi Database...${NC}"
cd "$TARGET_DIR"
if [ -f "$TARGET_DIR/apps/admin-dashboard/package.json" ]; then
    cd "$TARGET_DIR/apps/admin-dashboard"
    npm install
    npm run build
fi

cd "$TARGET_DIR"
if [ -f "$TARGET_DIR/apps/api/migrate.php" ]; then
    php "$TARGET_DIR/apps/api/migrate.php" || true
fi

# Folder upload & permissions
chmod 755 "/home/$TARGET_USER"
chmod -R 755 "$TARGET_DIR"
mkdir -p "$TARGET_DIR/apps/api/public/uploads"
mkdir -p "$TARGET_DIR/apps/api/public/storage/receipts"
chmod -R 777 "$TARGET_DIR/apps/api/public/uploads"
chmod -R 777 "$TARGET_DIR/apps/api/public/storage"
chown -R www-data:www-data "$TARGET_DIR/apps/api/public/uploads"
chown -R www-data:www-data "$TARGET_DIR/apps/api/public/storage"

echo -e "\n${YELLOW}[8/10] Mengonfigurasi Nginx...${NC}"
if [ -f "$TARGET_DIR/nginx-laksana-pos.conf" ]; then
    cp "$TARGET_DIR/nginx-laksana-pos.conf" /etc/nginx/sites-available/laksana-pos.conf
    ln -sf /etc/nginx/sites-available/laksana-pos.conf /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl reload nginx
    echo -e "${GREEN}✓ Nginx aktif dan berjalan sempurna.${NC}"
fi

echo -e "\n${YELLOW}[9/10] Mengonfigurasi Dashboard & Terminal Server (Cockpit)...${NC}"
systemctl enable --now cockpit.socket
cat << "EOF" > /etc/cockpit/cockpit.conf
[WebService]
Origins = https://server.poslaksana.my.id http://127.0.0.1:9090
ProtocolHeader = X-Forwarded-Proto
AllowUnencrypted = true
EOF
systemctl restart cockpit || true
echo -e "${GREEN}✓ Cockpit aktif di port 9090.${NC}"

echo -e "\n${YELLOW}[10/10] Memasang Cloudflare Tunnel (Menghubungkan Domain)...${NC}"
curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i /tmp/cloudflared.deb || apt-get install -f -y

TOKEN="eyJhIjoiYzA0Nzg0YjZmMGYxN2ZhOTJjZjczN2ZmNmRkNTJiNWYiLCJ0IjoiODE5Y2Y1MTgtZjQ4My00ZjE3LTk3ZmMtMzcyMDFhYWUzMWYwIiwicyI6Ik56Um1OalJtTWprdFlqQTVNQzAwTUdVeExUa3hOV1F0TVRsaU56VmlaVE5sWVRFeCJ9"
cloudflared service install "$TOKEN" || true
systemctl enable cloudflared
systemctl restart cloudflared

echo -e "\n${BLUE}========================================================${NC}"
echo -e "${GREEN}   ✓ SEMUA SISTEM LAKSANA POS BERHASIL DIPULIHKAN!      ${NC}"
echo -e "${BLUE}========================================================${NC}"
echo -e "Status Cloudflare Tunnel:"
systemctl status cloudflared --no-pager -l || true
echo -e "\nWeb Kasir:      https://poslaksana.my.id"
echo -e "Server Monitor: https://server.poslaksana.my.id\n"
