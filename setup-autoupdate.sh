#!/bin/bash
# ==============================================================
# Laksana POS - Setup Auto-Update Otomatis untuk Server Linux
# ==============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;36m'
NC='\033[0m'

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}   LAKSANA POS - AKTIFKAN AUTO-UPDATE OTOMATIS (MAIN)   ${NC}"
echo -e "${BLUE}========================================================${NC}"

TARGET_USER="fikri"
TARGET_DIR="/home/$TARGET_USER/Laksana-POS-APPS"

if [ ! -d "$TARGET_DIR" ]; then
    TARGET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

CHECK_SCRIPT="$TARGET_DIR/check-update.sh"
chmod +x "$CHECK_SCRIPT"
chmod +x "$TARGET_DIR/deploy.sh"

echo -e "\n${YELLOW}[1/3] Menyiapkan script pengecekan update...${NC}"
echo -e "${GREEN}✓ Script siap: $CHECK_SCRIPT${NC}"

echo -e "\n${YELLOW}[2/3] Memasang Cron Job Otomatis (Cek setiap 2 menit)...${NC}"
CRON_CMD="*/2 * * * * /bin/bash $CHECK_SCRIPT >/dev/null 2>&1"

# Pasang cron job untuk user fikri tanpa menduplikasi
(crontab -u "$TARGET_USER" -l 2>/dev/null | grep -Fv "$CHECK_SCRIPT" ; echo "$CRON_CMD") | crontab -u "$TARGET_USER" -

echo -e "${GREEN}✓ Cron job berhasil dipasang untuk user $TARGET_USER!${NC}"
echo "  Pengecekan berjalan otomatis setiap 2 menit di background."

echo -e "\n${YELLOW}[3/3] Memastikan izin dan kepemilikan folder...${NC}"
if [ "$EUID" -eq 0 ]; then
    chown -R "$TARGET_USER:$TARGET_USER" "$TARGET_DIR"
fi

echo -e "\n${GREEN}========================================================${NC}"
echo -e "${GREEN}  ✓ FITUR AUTO-UPDATE BERHASIL DIAKTIFKAN 100%!         ${NC}"
echo -e "${GREEN}========================================================${NC}"
echo -e "Sekarang, setiap kali Anda melakukan 'git push origin main':"
echo -e " 1. Server otomatis mendeteksi commit baru dalam rentang 2 menit."
echo -e " 2. Server otomatis menjalankan 'git pull origin main'."
echo -e " 3. Server otomatis mengompilasi Frontend ('npm run build') & migrasi DB."
echo -e " 4. Pantau log proses update kapan saja lewat perintah:"
echo -e "    ${BLUE}tail -f /home/fikri/autoupdate.log${NC}\n"
