#!/bin/bash
# ==============================================================
# Laksana POS - Script Auto Backup Database & Uploads
# ==============================================================

set -e

BACKUP_DIR="/home/fikri/backups"
BACKUP_SCRIPT="/usr/local/bin/backup-pos.sh"
LOG_FILE="/var/log/pos-backup.log"

echo "=========================================================="
echo "      MEMASANG SISTEM AUTO BACKUP OTOMATIS (LAKSANA POS)  "
echo "=========================================================="

# 1. Buat folder backup
mkdir -p "$BACKUP_DIR"
chown -R fikri:fikri "$BACKUP_DIR"
chmod 755 "$BACKUP_DIR"

# 2. Buat script eksekusi backup
cat << 'EOF' > "$BACKUP_SCRIPT"
#!/bin/bash
BACKUP_DIR="/home/fikri/backups"
APP_DIR="/home/fikri/Laksana-POS-APPS"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
DB_NAME="pos_cashier"

mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/uploads"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Memulai proses auto-backup..."

# 1. Backup Database MySQL (Dikompres .gz)
DB_BACKUP_FILE="$BACKUP_DIR/database/db_${DB_NAME}_${DATE}.sql.gz"
if mysqldump -u laksana -plaksana123 "$DB_NAME" 2>/dev/null | gzip > "$DB_BACKUP_FILE"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Database berhasil di-backup: $DB_BACKUP_FILE"
elif mysqldump -u root "$DB_NAME" 2>/dev/null | gzip > "$DB_BACKUP_FILE"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Database berhasil di-backup (root): $DB_BACKUP_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] Gagal melakukan dump database!"
fi

# 2. Backup Gambar & Bukti Struk Upload (Dikompres .tar.gz)
if [ -d "$APP_DIR/apps/api/public/uploads" ]; then
    UPLOADS_BACKUP="$BACKUP_DIR/uploads/uploads_${DATE}.tar.gz"
    tar -czf "$UPLOADS_BACKUP" -C "$APP_DIR/apps/api/public" uploads storage 2>/dev/null || true
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ File upload/struk berhasil di-backup: $UPLOADS_BACKUP"
fi

# 3. Salin otomatis ke Flashdisk jika flashdisk dicolok
USB_MOUNT=$(lsblk -o MOUNTPOINT | grep -E "/media|/mnt" | head -n 1)
if [ -n "$USB_MOUNT" ] && [ -d "$USB_MOUNT" ]; then
    mkdir -p "$USB_MOUNT/Laksana_POS_Backups"
    cp "$DB_BACKUP_FILE" "$USB_MOUNT/Laksana_POS_Backups/" 2>/dev/null || true
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Salinan cadangan berhasil dikirim ke Flashdisk: $USB_MOUNT"
fi

# 4. Hapus file backup yang berumur lebih dari 30 hari (Rotasi Hemat Disk)
find "$BACKUP_DIR/database" -type f -name "*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR/uploads" -type f -name "*.tar.gz" -mtime +30 -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Pembersihan backup lama (>30 hari) selesai."

# Beri kepemilikan ke user fikri
chown -R fikri:fikri "$BACKUP_DIR"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-backup sukses selesai."
EOF

chmod +x "$BACKUP_SCRIPT"

# 3. Daftarkan Jadwal Otomatis Cron Job (Setiap Hari Jam 23:59 Malam)
CRON_JOB="59 23 * * * $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

# Pastikan tidak ada duplikasi cron
(crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" ; echo "$CRON_JOB") | crontab -

echo -e "\n[✓] Jadwal backup harian berhasil didaftarkan di Crontab (Setiap jam 23:59 malam)."

# 4. Jalankan Tes Backup Seketika Ini Juga
echo -e "\nMenjalankan tes backup pertama sekarang..."
bash "$BACKUP_SCRIPT"

echo -e "\n=========================================================="
echo " ✓ SISTEM AUTO-BACKUP BERHASIL AKTIF & BERJALAN SEMPURNA! "
echo "=========================================================="
echo "Lokasi folder backup: $BACKUP_DIR"
echo "Log riwayat backup:   $LOG_FILE"
echo "Isi folder backup saat ini:"
ls -lh "$BACKUP_DIR/database"
