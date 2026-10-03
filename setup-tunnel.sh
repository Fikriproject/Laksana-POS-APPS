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

echo -e "\n[1/3] Menyiapkan repositori resmi Cloudflare..."
mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | tee /etc/apt/sources.list.d/cloudflared.list

echo -e "\n[2/3] Menginstall cloudflared..."
apt-get update -y
apt-get install -y cloudflared

echo -e "\n[3/3] Memasang Cloudflare Service dengan Token..."
TOKEN="eyJhIjoiYzA0Nzg0YjZmMGYxN2ZhOTJjZjczN2ZmNmRkNTJiNWYiLCJ0IjoiODE5Y2Y1MTgtZjQ4My00ZjE3LTk3ZmMtMzcyMDFhYWUzMWYwIiwicyI6Ik56Um1OalJtTWprdFlqQTVNQzAwTUdVeExUa3hOV1F0TVRsaU56VmlaVE5sWVRFeCJ9"

# Pasang service jika belum terpasang
cloudflared service install "$TOKEN" || true

systemctl enable cloudflared
systemctl restart cloudflared

echo -e "\n========================================================"
echo " ✓ CLOUDFLARE TUNNEL BERHASIL DIPASANG & SUDAH AKTIF!   "
echo "========================================================"
systemctl status cloudflared --no-pager -l
