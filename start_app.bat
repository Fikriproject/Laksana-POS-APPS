::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCyDJGyX8VAjFC5naTa+GGStCLkT6ezo08bKkXQzd6w2e4C7
::YAwzuBVtJxjWCl3EqQJgSA==
::ZR4luwNxJguZRRnk
::Yhs/ulQjdF+5
::cxAkpRVqdFKZSDk=
::cBs/ulQjdF+5
::ZR41oxFsdFKZSDk=
::eBoioBt6dFKZSDk=
::cRo6pxp7LAbNWATEpCI=
::egkzugNsPRvcWATEpCI=
::dAsiuh18IRvcCxnZtBJQ
::cRYluBh/LU+EWAnk
::YxY4rhs+aU+JeA==
::cxY6rQJ7JhzQF1fEqQJQ
::ZQ05rAF9IBncCkqN+0xwdVs0
::ZQ05rAF9IAHYFVzEqQJQ
::eg0/rx1wNQPfEVWB+kM9LVsJDGQ=
::fBEirQZwNQPfEVWB+kM9LVsJDGQ=
::cRolqwZ3JBvQF1fEqQJQ
::dhA7uBVwLU+EWDk=
::YQ03rBFzNR3SWATElA==
::dhAmsQZ3MwfNWATElA==
::ZQ0/vhVqMQ3MEVWAtB9wSA==
::Zg8zqx1/OA3MEVWAtB9wSA==
::dhA7pRFwIByZRRnk
::Zh4grVQjdCyDJGyX8VAjFC5naTa+GG6pDaET+NTXotm+jG5TUfo6GA==
::YB416Ek+ZG8=
::
::
::978f952a14a936cc963da21a135fa983
@echo off
setlocal EnableDelayedExpansion

echo ===================================================
echo   LAKSANA POS TOOLS - AUTOMATION SCRIPT
echo ===================================================

:: 1. START LARAGON (Gunakan /b agar jalan di background)
echo [1/5] Starting Laragon...
if exist "C:\laragon\laragon.exe" (
    start "" "C:\laragon\laragon.exe"
    timeout /t 3 >nul
)

:: 2. SETUP ENVIRONMENT
echo [2/5] Configuring Environment...
:: Cek PHP (opsional jika pnpm tidak butuh PHP langsung di terminal ini)
if exist "C:\laragon\bin\php" (
    for /d %%i in ("C:\laragon\bin\php\*") do set "PHP_PATH=%%i"
    set "PATH=!PHP_PATH!;%PATH%"
)

:: 3. GET LOCAL IP ADDRESS
echo [3/5] Detecting Network...
set "IP_ADDRESS=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set "IP_line=%%a"
    for /f "tokens=* delims= " %%b in ("!IP_line!") do set "IP_ADDRESS=%%b"
)

:: 4. LAUNCH BROWSER (Lakukan SEBELUM pnpm dev)
echo [4/5] Launching Chrome...
set "URL1=http://localhost:5173"
set "URL2=http://!IP_ADDRESS!:5173"

:: Coba buka Chrome, jika gagal buka default browser
start chrome "%URL1%"
start chrome "%URL2%"

:: 5. START SERVER (Gunakan START agar terminal tidak terkunci)
echo [5/5] Starting POS System Server...
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] pnpm tidak ditemukan!
    pause
    exit /b
)

:: Menjalankan pnpm dev di jendela terminal yang sama
echo.
echo Server sedang berjalan... JANGAN TUTUP TERMINAL INI.
pnpm dev

pause
