#!/bin/bash
# ==============================================================
# Laksana POS - Pemasang Otomatis Auto-Backup Malam Hari
# ==============================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${HOME}/backups"
LOG_FILE="${BACKUP_DIR}/backup.log"
BACKUP_SCRIPT="${ROOT_DIR}/backup.sh"

echo "=========================================================="
echo "    MEMASANG SISTEM AUTO-BACKUP MALAM HARI (LAKSANA POS)  "
echo "=========================================================="

# 1. Pastikan folder backup tersedia
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/uploads"
chmod 755 "$BACKUP_DIR"

# 2. Beri hak eksekusi pada script backup
chmod +x "$BACKUP_SCRIPT"
chmod +x "$ROOT_DIR/apps/api/scripts/backup_database.php"

# 3. Daftarkan Jadwal Cron Job Otomatis (Setiap Malam Jam 00:00 / Tengah Malam)
CRON_CMD="$BACKUP_SCRIPT"
CRON_JOB="0 0 * * * $CRON_CMD"

# Periksa apakah cron sudah terdaftar, jika belum tambahkan
if crontab -l 2>/dev/null | grep -Fq "$BACKUP_SCRIPT"; then
    echo "[✓] Jadwal backup sudah ada di Crontab Anda."
else
    (crontab -l 2>/dev/null | grep -Fv "$BACKUP_SCRIPT" ; echo "$CRON_JOB") | crontab -
    echo "[✓] Berhasil mendaftarkan cron job (Setiap hari jam 00:00 malam)."
fi

echo -e "\nJadwal Crontab Aktif Saat Ini:"
crontab -l | grep -F "$BACKUP_SCRIPT"

# 4. Jalankan Tes Backup Langsung untuk Memverifikasi Keberhasilan
echo -e "\n----------------------------------------------------------"
echo "Menjalankan tes backup database sekarang untuk verifikasi..."
echo "----------------------------------------------------------"
bash "$BACKUP_SCRIPT"

echo -e "\n=========================================================="
echo " ✓ AUTO-BACKUP BERHASIL DIAKTIFKAN DAN TERUJI SUKSES!     "
echo "=========================================================="
echo "Lokasi Folder Backup : $BACKUP_DIR"
echo "File SQL Terbaru     : $BACKUP_DIR/database/latest_backup.sql"
echo "File Log Riwayat     : $LOG_FILE"
echo -e "\nDaftar file backup saat ini:"
ls -lh "$BACKUP_DIR/database"
echo "=========================================================="
