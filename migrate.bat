@echo off
title Laksana POS - Database Migration
echo Menjalankan migrasi database Laksana POS...
php apps\api\migrate.php %*
echo.
pause
