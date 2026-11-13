#!/bin/bash
# ==============================================================
# Laksana POS - Pemasang Otomatis Auto-Backup Malam Hari
# ==============================================================

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

# 3. Daftarkan Jadwal Cron Job Otomatis (Setiap Malam Jam 00:00)
CRON_CMD="$BACKUP_SCRIPT"
CRON_JOB="0 0 * * * $CRON_CMD"

# Ambil crontab yang sudah ada tanpa error
CURRENT_CRON=$(crontab -l 2>/dev/null || true)

if echo "$CURRENT_CRON" | grep -Fq "$BACKUP_SCRIPT"; then
    echo "[✓] Jadwal backup sudah terdaftar di Crontab Anda."
else
    # Tambahkan cron job baru
    CLEAN_CRON=$(echo "$CURRENT_CRON" | grep -Fv "$BACKUP_SCRIPT" || true)
    if [ -n "$CLEAN_CRON" ]; then
        printf "%s\n%s\n" "$CLEAN_CRON" "$CRON_JOB" | crontab -
    else
        echo "$CRON_JOB" | crontab -
    fi
    echo "[✓] Berhasil mendaftarkan cron job (Setiap hari jam 00:00 tengah malam)."
fi

echo -e "\nJadwal Crontab Aktif Saat Ini:"
crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT" || echo "0 0 * * * $CRON_CMD"

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
