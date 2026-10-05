#!/bin/bash
mysql -e "CREATE USER IF NOT EXISTS 'laksana'@'localhost' IDENTIFIED BY 'laksana123';"
mysql -e "ALTER USER 'laksana'@'localhost' IDENTIFIED BY 'laksana123';"
mysql -e "GRANT ALL PRIVILEGES ON pos_cashier.* TO 'laksana'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

cat << "EOF" > /home/fikri/Laksana-POS-APPS/apps/api/.env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pos_cashier
DB_USER=laksana
DB_PASSWORD=laksana123
JWT_SECRET=laksana-pos-jwt-super-secret-key-2026
JWT_EXPIRY=86400
API_DEBUG=false
EOF

systemctl restart php8.3-fpm
echo -e "\n\033[1;32m✓ USER DATABASE 'laksana' BERHASIL DIBUAT & TERHUBUNG 100%!\033[0m\n"
