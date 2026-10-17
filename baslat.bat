@echo off
title Dosya Donusturucu (Cevrimdisi PWA)
echo ===================================================
echo     Dosya Donusturucu Baslatiliyor...
echo ===================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [BILGI] Bilgisayarinizda Node.js kurulu degil veya taninmadi.
    echo Lutfen https://nodejs.org adresine giderek Node.js yukleyin.
    echo.
    pause
    exit /b
)

if not exist node_modules (
    echo.
    echo Paketler ilk defa kuruluyor, lutfen 1-2 dakika bekleyin...
    call npm install
)

echo.
echo Tarayici aciliyor...
start http://localhost:3000

echo.
echo Gelistirici sunucusu baslatiliyor...
echo (Kapatmak istediginizde bu pencereyi kapatabilirsiniz)
call npm run dev
pause
