#!/bin/bash
# Laksana POS - Import Produk Terbaru Runner for Linux / Server
echo "Menjalankan import data produk terbaru Laksana POS..."
php apps/api/import_products.php "$@"
