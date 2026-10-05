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

# Perbaikan Cockpit (Cockpit Bridge & WebSocket)
apt-get install -y cockpit-bridge cockpit-system || true
cat << "EOF" > /etc/cockpit/cockpit.conf
[WebService]
Origins = https://server.poslaksana.my.id wss://server.poslaksana.my.id http://127.0.0.1:9090
ProtocolHeader = X-Forwarded-Proto
AllowUnencrypted = true
EOF
systemctl restart cockpit.socket cockpit || true

echo -e "\n\033[1;32m✓ SISTEM & COCKPIT BERHASIL DIPERBAIKI 100%!\033[0m\n"
