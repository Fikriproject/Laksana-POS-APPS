#!/bin/bash
# ==============================================================
# Laksana POS - Auto-Update Poller
# Mengecek commit baru di branch main dan deploy otomatis
# ==============================================================

LOCKFILE="/tmp/laksana_autoupdate.lock"
LOGFILE="/home/fikri/autoupdate.log"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Hindari eksekusi ganda jika update sebelumnya masih berjalan
if [ -f "$LOCKFILE" ]; then
    # Jika lock file lebih dari 10 menit, kemungkinan hang -> hapus
    if test "$(find "$LOCKFILE" -mmin +10 2>/dev/null)"; then
        rm -f "$LOCKFILE"
    else
        exit 0
    fi
fi

cd "$PROJECT_DIR" || exit 1

# Fetch branch main dari GitHub
git fetch origin main --quiet 2>/dev/null || exit 0

LOCAL=$(git rev-parse HEAD 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null)

if [ -n "$LOCAL" ] && [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
    touch "$LOCKFILE"
    echo "--------------------------------------------------------" >> "$LOGFILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Perubahan baru terdeteksi di GitHub main!" >> "$LOGFILE"
    echo "Local  : $LOCAL" >> "$LOGFILE"
    echo "Remote : $REMOTE" >> "$LOGFILE"
    echo "Memulai proses build & deploy otomatis..." >> "$LOGFILE"

    # Jalankan deploy
    bash "$PROJECT_DIR/deploy.sh" >> "$LOGFILE" 2>&1
    DEPLOY_STATUS=$?

    if [ $DEPLOY_STATUS -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Auto-update berhasil diselesaikan!" >> "$LOGFILE"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ Auto-update gagal dengan kode exit $DEPLOY_STATUS" >> "$LOGFILE"
    fi
    echo "--------------------------------------------------------" >> "$LOGFILE"
    rm -f "$LOCKFILE"
fi
