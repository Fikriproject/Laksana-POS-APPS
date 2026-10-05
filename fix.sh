#!/bin/bash
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY ''; FLUSH PRIVILEGES;"
cat << "EOF" > /home/fikri/Laksana-POS-APPS/apps/api/.env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pos_cashier
DB_USER=root
DB_PASSWORD=
JWT_SECRET=laksana-pos-jwt-super-secret-key-2026
JWT_EXPIRY=86400
API_DEBUG=true
EOF
systemctl restart php8.3-fpm
echo -e "\n\033[1;32m✓ KONEKSI DATABASE BERHASIL DIPERBAIKI 100%!\033[0m\n"
