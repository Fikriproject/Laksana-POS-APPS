#!/bin/bash
# Laksana POS - Database Migration Runner for Linux / Server
echo "Menjalankan migrasi database Laksana POS..."
php apps/api/migrate.php "$@"
