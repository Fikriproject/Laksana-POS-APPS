#!/usr/bin/env bash
set -e

echo "========================================================"
echo "    MEMASANG CLOUDFLARE TUNNEL OTOMATIS (LAKSANA POS)   "
echo "========================================================"

# Pastikan dijalankan sebagai root / sudo
if [ "$EUID" -ne 0 ]; then
    echo "Harap jalankan script ini dengan sudo:"
    echo "  sudo bash setup-tunnel.sh"
    exit 1
fi

echo -e "\n[1/2] Mengunduh dan menginstall cloudflared..."
curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i /tmp/cloudflared.deb || apt-get install -f -y

echo -e "\n[3/3] Memasang Cloudflare Service dengan Token..."
TOKEN="eyJhIjoiYzA0Nzg0YjZmMGYxN2ZhOTJjZjczN2ZmNmRkNTJiNWYiLCJ0IjoiODE5Y2Y1MTgtZjQ4My00ZjE3LTk3ZmMtMzcyMDFhYWUzMWYwIiwicyI6Ik56Um1OalJtTWprdFlqQTVNQzAwTUdVeExUa3hOV1F0TVRsaU56VmlaVE5sWVRFeCJ9"

cloudflared service uninstall 2>/dev/null || true
cloudflared service install "$TOKEN"
systemctl daemon-reload
systemctl enable --now cloudflared
systemctl restart cloudflared

echo -e "\n========================================================"
echo " ✓ CLOUDFLARE TUNNEL BERHASIL DIPASANG & SUDAH AKTIF!   "
echo "========================================================"
systemctl status cloudflared --no-pager -l
