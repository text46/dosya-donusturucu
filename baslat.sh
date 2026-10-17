#!/bin/bash
echo "==================================================="
echo "    Dosya Dönüştürücü Başlatılıyor..."
echo "==================================================="

if ! command -v node &> /dev/null; then
    echo ""
    echo "[BILGI] Bilgisayarınızda Node.js kurulu değil."
    echo "Lütfen https://nodejs.org adresinden Node.js yükleyin."
    echo ""
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Paketler kuruluyor..."
    npm install
fi

echo "Tarayıcı açılıyor..."
(open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null) &

npm run dev
