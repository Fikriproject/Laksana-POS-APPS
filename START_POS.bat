::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCyDJGyX8VAjFDp3aTa+GGS5E7gZ5vzo08GGsUQPFM4+c5za1LWyDO8U5QvtdplN
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
::Zh4grVQjdCyDJGyX8VAjFDp3aTa+GGS5E7gZ5vzo08GGsUQPFM4+c5za1LWyEM8gqmnlfoUs2HsUndMJbA==
::YB416Ek+ZG8=
::
::
::978f952a14a936cc963da21a135fa983
@echo off
TITLE Kasir Laksana Launcher

:: Ensure we are in the script's directory (Crucial for EXE)
cd /d "%~dp0"

echo Starting Laragon...
if exist "C:\laragon\laragon.exe" (
    start "" "C:\laragon\laragon.exe"
) else (
    echo [INFO] Laragon tidak ditemukan.
)

echo Starting Backend Server (PHP)...
cd apps/api
:: Launch PHP in background (Same console)
start /B php -S 127.0.0.1:8000 -t public >nul 2>&1

echo Starting Frontend (Vite)...
cd ../../apps/admin-dashboard
:: Launch Vite in background (Same console)
start /B pnpm dev >nul 2>&1

echo Waiting for servers to start...
timeout /t 5 >nul

echo Opening Application...
start http://localhost:5173

echo.
echo Aplikasi berjalan di background.
echo Tutup jendela ini (jika terlihat) akan mematikan server.
echo Jika menggunakan mode "Invisible" di EXE, gunakan Task Manager untuk mematikan.

:: Keep script running to sustain background processes
cmd /k
