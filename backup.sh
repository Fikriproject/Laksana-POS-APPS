#!/bin/bash
# ==============================================================
# Laksana POS - Script Pelaksana Backup Harian
# ==============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="${HOME}/backups"
DB_BACKUP_DIR="${BACKUP_DIR}/database"
UPLOADS_BACKUP_DIR="${BACKUP_DIR}/uploads"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "$DB_BACKUP_DIR"
mkdir -p "$UPLOADS_BACKUP_DIR"

DATE_NOW=$(date +"%Y-%m-%d_%H-%M-%S")
echo -e "\n========================================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Memulai proses backup Laksana POS..." | tee -a "$LOG_FILE"

# 1. Jalankan Engine Backup Database PHP
PHP_BIN=$(which php 2>/dev/null || which php8.3 2>/dev/null || which php8.2 2>/dev/null || echo "php")

if "$PHP_BIN" apps/api/scripts/backup_database.php --output="$BACKUP_DIR"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Backup database berhasil." | tee -a "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] Backup database via PHP menemui masalah!" | tee -a "$LOG_FILE"
fi

# 2. Backup Gambar Produk & Struk Kasir (Uploads & Storage)
if [ -d "apps/api/public/uploads" ]; then
    UPLOADS_ARCHIVE="${UPLOADS_BACKUP_DIR}/uploads_${DATE_NOW}.tar.gz"
    tar -czf "$UPLOADS_ARCHIVE" -C apps/api/public uploads storage 2>/dev/null || true
    if [ -f "$UPLOADS_ARCHIVE" ]; then
        UPLOADS_SIZE=$(du -sh "$UPLOADS_ARCHIVE" 2>/dev/null | cut -f1)
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ File media & struk tersimpan: ${UPLOADS_ARCHIVE} (${UPLOADS_SIZE})" | tee -a "$LOG_FILE"
        cp -f "$UPLOADS_ARCHIVE" "${UPLOADS_BACKUP_DIR}/latest_uploads.tar.gz" 2>/dev/null || true
    fi
fi

# 3. Salin otomatis ke Flashdisk jika terpasang
USB_MOUNT=$(lsblk -o MOUNTPOINT 2>/dev/null | grep -E "/media|/mnt" | head -n 1 || true)
if [ -n "$USB_MOUNT" ] && [ -d "$USB_MOUNT" ]; then
    USB_BACKUP_DIR="$USB_MOUNT/Laksana_POS_Backups"
    mkdir -p "$USB_BACKUP_DIR" 2>/dev/null || true
    cp -f "${DB_BACKUP_DIR}/latest_backup.sql" "$USB_BACKUP_DIR/" 2>/dev/null || true
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Salinan cadangan berhasil dikirim ke Flashdisk: $USB_MOUNT" | tee -a "$LOG_FILE"
fi

# 4. Hapus arsip uploads lama (> 30 hari)
find "$UPLOADS_BACKUP_DIR" -type f -name "uploads_*.tar.gz" -mtime +30 -delete 2>/dev/null || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Seluruh proses backup selesai sempurna." | tee -a "$LOG_FILE"
