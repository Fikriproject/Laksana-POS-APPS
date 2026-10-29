@echo off
title Laksana POS - Import Produk Terbaru
echo Menjalankan import data produk terbaru Laksana POS...
php apps\api\import_products.php %*
echo.
pause
