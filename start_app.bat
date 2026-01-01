@echo off
setlocal EnableDelayedExpansion

echo ===================================================
echo   LAKSANA POS TOOLS - AUTOMATION SCRIPT
echo ===================================================

:: 1. START LARAGON
echo [1/5] Starting Laragon...
if exist "C:\laragon\laragon.exe" (
    start "" "C:\laragon\laragon.exe"
    echo      Laragon started.
) else (
    echo      Warning: Laragon not found at C:\laragon\laragon.exe
    echo      Please ensure database services are running.
)

:: 2. SETUP REACT & PHP ENVIRONMENT
echo [2/5] Configuring PHP Environment...
set "PHP_FOUND=0"
if exist "C:\laragon\bin\php" (
    :: Find the last (typically newest) PHP version in Laragon
    for /d %%i in ("C:\laragon\bin\php\*") do (
        set "PHP_PATH=%%i"
        set "PHP_FOUND=1"
    )
)

if "!PHP_FOUND!"=="1" (
    echo      Found PHP at: !PHP_PATH!
    set "PATH=!PHP_PATH!;%PATH%"
    php -v | findstr "PHP"
) else (
    echo      [ERROR] PHP installation not found in C:\laragon\bin\php
    echo      Attempting to run anyway (system PATH usage)...
)

:: 3. GET LOCAL IP ADDRESS
echo [3/5] Detecting Network...
set "IP_ADDRESS=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set "IP_line=%%a"
    :: Remove leading space
    for /f "tokens=* delims= " %%b in ("!IP_line!") do set "IP_ADDRESS=%%b"
)
echo      Local IP detected: !IP_ADDRESS!

:: 4. PREPARE BROWSER LAUNCH
echo [4/5] Preparing Browser Launch...
:: Wait a bit for servers to spire up, then open browser
:: We use a separate parallel process for this so pnpm dev can stay in foreground
(
    timeout /t 10 >nul
    echo.
    echo      Opening Microsoft Edge...
    start msedge "http://localhost:5173"
    start msedge "http://!IP_ADDRESS!:5173"
) | start /b cmd /c "@echo away"

:: 5. START APPLICATION
echo [5/5] Starting POS System (Frontend + Backend)...
echo.
echo      - Frontend: http://localhost:5173
echo      - Backend : http://localhost:8000
echo      - Network : http://!IP_ADDRESS!:5173
echo.
echo      Press Ctrl+C to stop.
echo.

:: Run the original pnpm dev command
call pnpm dev

pause
