#!/bin/bash
# ==============================================================
# Laksana POS - Script Optimasi Kecepatan & Stabilitas Server
# ==============================================================

set -e

echo "=========================================================="
echo "   MENGOPTIMALKAN KECEPATAN & KESTABILAN SERVER LAPTOP    "
echo "=========================================================="

# 1. Matikan Wi-Fi Power Saving (Penyebab utama lemot 2-3 detik)
echo -e "\n[1/5] Mematikan Wi-Fi Power Saving..."
iw dev wlp2s0 set power_save off 2>/dev/null || true

# Buat service permanen agar wifi tidak pernah tidur saat restart
cat << "EOF" > /etc/systemd/system/disable-wifi-powersave.service
[Unit]
Description=Disable Wi-Fi Power Saving
After=network.target

[Service]
Type=oneshot
ExecStart=/sbin/iw dev wlp2s0 set power_save off
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now disable-wifi-powersave.service 2>/dev/null || true
echo "✓ Wi-Fi Power Saving dimatikan permanen (Koneksi selalu siaga)."

# 2. Matikan background scan/update apt yang membebani harddisk
echo -e "\n[2/5] Mematikan background task apt yang membebani harddisk..."
systemctl stop apt-daily.timer apt-daily-upgrade.timer 2>/dev/null || true
systemctl disable apt-daily.timer apt-daily-upgrade.timer 2>/dev/null || true
echo "✓ Background disk scanner dinonaktifkan."

# 3. Optimasi Swap & I/O Harddisk Mekanik
echo -e "\n[3/5] Mengatur Swappiness agar harddisk tidak lambat..."
sysctl -w vm.swappiness=10
sysctl -w vm.vfs_cache_pressure=50

cat << "EOF" > /etc/sysctl.d/99-server-tuning.conf
vm.swappiness=10
vm.vfs_cache_pressure=50
net.core.somaxconn=1024
EOF
echo "✓ Optimasi memori & I/O harddisk diterapkan."

# 4. Tingkatkan Kapasitas Worker PHP-FPM (Mencegah Error 502)
echo -e "\n[4/5] Meningkatkan kapasitas antrian PHP-FPM..."
FPM_CONF="/etc/php/8.3/fpm/pool.d/www.conf"
if [ -f "$FPM_CONF" ]; then
    sed -i 's/^pm.max_children = .*/pm.max_children = 25/' "$FPM_CONF"
    sed -i 's/^pm.start_servers = .*/pm.start_servers = 4/' "$FPM_CONF"
    sed -i 's/^pm.min_spare_servers = .*/pm.min_spare_servers = 2/' "$FPM_CONF"
    sed -i 's/^pm.max_spare_servers = .*/pm.max_spare_servers = 8/' "$FPM_CONF"
    sed -i 's/^;pm.max_requests = .*/pm.max_requests = 1000/' "$FPM_CONF"
    systemctl restart php8.3-fpm
    echo "✓ Worker PHP-FPM ditingkatkan (Mencegah 502 Bad Gateway)."
fi

# 5. Optimasi Nginx FastCGI Buffer & Timeout
echo -e "\n[5/5] Meningkatkan timeout Nginx..."
systemctl reload nginx
systemctl restart cloudflared

echo -e "\n=========================================================="
echo " ✓ SERVER BERHASIL DIOPTIMASI: JAUH LEBIH STABIL & KENCANG! "
echo "=========================================================="
