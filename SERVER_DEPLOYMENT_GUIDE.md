# 🛡️ Panduan Publikasi & Pengamanan Server Linux (Laksana POS)

Panduan ini berisi langkah-langkah konkret untuk mempublikasikan Laksana POS di server Linux (VPS / Cloud) dengan standar keamanan tinggi (bebas dari celah keamanan Nuclei / OWASP).

---

## 🚀 Langkah 1: Tarik Pembaruan Terbaru dari GitHub

Di terminal server Linux Anda:
```bash
cd /path/ke/Laksana-POS-APPS
git pull origin main
```

---

## ⚙️ Langkah 2: Atur Environment Produksi Aman

Masuk ke folder API dan buat file `.env`:
```bash
cd apps/api
cp .env.production.example .env
nano .env
```

Pastikan nilai berikut diisi dengan benar:
1. `API_DEBUG=false` *(PENTING: Jangan set true di server publik)*
2. `CORS_ORIGIN=https://pos.domainanda.com` *(Atau http://IP-SERVER jika belum ada domain)*
3. `JWT_SECRET=...` *(Isi dengan kode acak minimal 32 karakter)*
4. Kredensial Database (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` atau `DATABASE_URL`)

Simpan di nano: Tekan `Ctrl + O` lalu `Enter`, kemudian keluar dengan `Ctrl + X`.  
Kembali ke folder utama:
```bash
cd ../..
```

---

## 📦 Langkah 3: Jalankan 1 Perintah Deploy Otomatis

Beri izin eksekusi lalu jalankan script deploy:
```bash
chmod +x deploy.sh migrate.sh
./deploy.sh
```

Script ini akan otomatis:
1. Menarik update terbaru dari GitHub.
2. Meng-compile Frontend React menjadi file statis terkompresi di folder `apps/admin-dashboard/dist/`.
3. Memasang dependensi Composer jika diperlukan.
4. Menjalankan migrasi database otomatis.
5. Mengamankan izin folder uploads & storage.

---

## 🌐 Langkah 4: Pasang Konfigurasi Nginx Aman

File konfigurasi Nginx yang sudah dilengkapi seluruh **Security Headers** telah kami siapkan di `nginx-laksana-pos.conf`.

1. Pasang Nginx (jika belum ada):
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```

2. Salin file konfigurasi yang sudah disiapkan:
   ```bash
   sudo cp nginx-laksana-pos.conf /etc/nginx/sites-available/laksana-pos.conf
   ```

3. Sesuaikan nama domain dan path folder:
   ```bash
   sudo nano /etc/nginx/sites-available/laksana-pos.conf
   ```
   - Ganti `server_name pos.domainanda.com;` dengan domain atau IP Anda.
   - Ganti `set $root_path /var/www/Laksana-POS-APPS;` dengan path folder tempat aplikasi Anda berada.

4. Aktifkan konfigurasi Nginx:
   ```bash
   sudo ln -sf /etc/nginx/sites-available/laksana-pos.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 🔒 Langkah 5: Kunci Firewall Server Linux (UFW)

Tutup semua port internal dan hanya izinkan port web (80 & 443) serta remote SSH (22):
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # Akses SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🔑 Langkah 6: Pasang SSL / HTTPS Gratis (Let's Encrypt)

Jika Anda sudah menghubungkan domain ke IP server:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d pos.domainanda.com
```
Certbot akan otomatis menambahkan sertifikat HTTPS dan memperbarui konfigurasi Nginx Anda.

---

## ✨ Selesai!
Sekarang aplikasi Anda sudah berjalan dalam mode produksi dengan keamanan penuh. Saat di-scan ulang dengan **Nuclei**, tidak akan ada lagi celah CVE Vite, file sensitif yang bocor, maupun security headers yang hilang.
