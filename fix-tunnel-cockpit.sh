#!/bin/bash
# ==============================================================
# Laksana POS - Fix Cloudflare Tunnel & Cockpit Flapping / Crash
# Mengatasi error 502 Bad Gateway dan error 1033 yang putus-nyambung
# ==============================================================

set -e

echo -e "\033[1;36m========================================================\033[0m"
echo -e "\033[1;36m   MEMPERBAIKI STABILITAS CLOUDFLARE TUNNEL & COCKPIT   \033[0m"
echo -e "\033[1;36m========================================================\033[0m\n"

# 1. Pastikan script dijalankan sebagai root / sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "\033[31m[ERROR] Jalankan script ini dengan sudo: sudo ./fix-tunnel-cockpit.sh\033[0m"
    exit 1
fi

echo -e "\033[1;33m[1/4] Mengubah protokol Cloudflared ke HTTP/2 (TCP stabil)...\033[0m"
# Mengubah dari QUIC (UDP yang sering di-drop router) ke HTTP2 (TCP anti-drop)
if [ -f "/etc/systemd/system/cloudflared.service" ]; then
    if ! grep -q -- "--protocol http2" /etc/systemd/system/cloudflared.service; then
        sed -i 's/tunnel run/tunnel --protocol http2 run/g' /etc/systemd/system/cloudflared.service
        systemctl daemon-reload
        echo -e "\033[32m✓ Protokol Cloudflared diubah ke HTTP/2.\033[0m"
    else
        echo -e "\033[32m✓ Protokol Cloudflared sudah menggunakan HTTP/2.\033[0m"
    fi
    systemctl restart cloudflared
    echo -e "\033[32m✓ Layanan cloudflared berhasil di-restart.\033[0m"
fi

echo -e "\n\033[1;33m[2/4] Menonaktifkan Wi-Fi Power Saving (Mencegah laptop tidur saat diam)...\033[0m"
if [ -f "/etc/NetworkManager/conf.d/default-wifi-powersave-on.conf" ]; then
    sed -i 's/wifi.powersave = 3/wifi.powersave = 2/' /etc/NetworkManager/conf.d/default-wifi-powersave-on.conf
    systemctl restart NetworkManager 2>/dev/null || true
    echo -e "\033[32m✓ Wi-Fi Power Saving dinonaktifkan permanen.\033[0m"
fi

WIFI_IFACE=$(ip -o link show | awk -F': ' '{print $2}' | grep -E '^w' | head -1)
if [ -n "$WIFI_IFACE" ]; then
    iw dev "$WIFI_IFACE" set power_save off 2>/dev/null || true
    echo -e "\033[32m✓ Interface $WIFI_IFACE diset selalu aktif (Power Save: OFF).\033[0m"
fi

echo -e "\n\033[1;33m[3/4] Mengatur agar laptop tidak sleep saat layar/lid ditutup...\033[0m"
if [ -f "/etc/systemd/logind.conf" ]; then
    sed -i 's/#HandleLidSwitch=suspend/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
    sed -i 's/HandleLidSwitch=suspend/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
    sed -i 's/#HandleLidSwitchExternalPower=suspend/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf
    sed -i 's/HandleLidSwitchExternalPower=suspend/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf
    systemctl restart systemd-logind 2>/dev/null || true
    echo -e "\033[32m✓ Laptop diatur agar selalu menyala meskipun layar ditutup.\033[0m"
fi

echo -e "\n\033[1;33m[4/4] Memperbaiki konfigurasi Cockpit (Web Terminal & Monitor)...\033[0m"
mkdir -p /etc/cockpit
cat << "EOF" > /etc/cockpit/cockpit.conf
[WebService]
Origins = https://server.poslaksana.my.id wss://server.poslaksana.my.id http://127.0.0.1:9090
ProtocolHeader = X-Forwarded-Proto
AllowUnencrypted = true
MaxStartups = 100
EOF

systemctl enable --now cockpit.socket 2>/dev/null || true
systemctl restart cockpit.socket cockpit 2>/dev/null || true
echo -e "\033[32m✓ Cockpit diatur dengan WebSocket origin & MaxStartups optimal.\033[0m"

# Pastikan Nginx juga aktif
systemctl restart nginx 2>/dev/null || true

echo -e "\n\033[1;32m========================================================\033[0m"
echo -e "\033[1;32m   ✓ SELURUH SISTEM JARINGAN & COCKPIT BERHASIL DI-FIX! \033[0m"
echo -e "\033[1;32m========================================================\033[0m\n"
echo -e "Status Cloudflared:"
systemctl status cloudflared --no-pager -l | head -n 12
echo -e "\nStatus Cockpit:"
systemctl status cockpit.socket --no-pager -l | head -n 10
echo ""
