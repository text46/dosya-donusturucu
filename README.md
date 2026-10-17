# 📁 Dosya Dönüştürücü (Çevrimdışı PWA)

Galerinizden seçtiğiniz fotoğrafları ve Office (Word, Excel, Metin) belgelerini internet bağlantısına gerek duymadan **%100 çevrimdışı ve gizli** bir şekilde PDF belgesine dönüştüren modern Progresif Web Uygulaması (PWA).

## 🚀 Öne Çıkan Özellikler

- **%100 Çevrimdışı (Offline-First)**: Fotoğraflar hiçbir sunucuya yüklenmez, tüm işlemler cihazın kendi tarayıcısında yerel olarak yapılır.
- **PWA Desteği**: Android, iOS (iPhone/iPad) ve masaüstü bilgisayarlara ana ekrana uygulama olarak yüklenebilir.
- **Kamera & Galeri Entegrasyonu**: Telefonun kamerasından doğrudan çekim yapabilme ve galeriden çoklu görsel seçebilme.
- **Sayfa Sıralama**: Yukarı/aşağı butonlarıyla sayfaların PDF'teki sırasını kolayca düzenleme.
- **Görsel Düzenleme**: 90° döndürme ve özel belge filtreleri (Belge Modu, Gri Ton, Siyah-Beyaz Fotokopi).
- **PDF Ayarları**:
  - Sayfa Formatı: A4, Letter veya Otomatik (görsel boyutuna uyumlu).
  - Sayfa Yönü: Dikey, Yatay veya Otomatik.
  - Kenar Boşlukları (0 mm, 5 mm, 12 mm).
  - Kalite / Boyut Optimizasyonu (Yüksek, Dengeli, Düşük MB).
- **Office'ten PDF'e Dönüştürme**:
  - Microsoft Word (`.docx`): Başlıklar, tablolar, paragraflar ve listeler korunarak A4 PDF'e aktarılır.
  - Microsoft Excel (`.xlsx`, `.xls`, `.csv`): Tablolar, hücre kenarlıkları ve çoklu çalışma sayfaları seçimi ile dikey/yatay PDF'e dönüştürülür.
  - Düz Metin (`.txt`): Okunaklı ve biçimli PDF çıktısı.
- **Dönüştürme Geçmişi (IndexedDB)**: Oluşturulan tüm PDF'ler cihazın yerel hafızasında saklanır; internet olmadan yeniden önizlenebilir, indirilebilir veya paylaşılabilir.
- **Doğrudan Paylaşım**: Mobil Web Share API entegrasyonu ile oluşturulan PDF'i anında WhatsApp, E-posta, Telegram vb. üzerinden gönderme.

---

## 💻 Bilgisayarda Kurulum ve Çalıştırma

Projeyi bilgisayarınızda açmak ve geliştirmek için aşağıdaki adımları izleyin:

### 1. Gereksinimler
- [Node.js](https://nodejs.org/) (Sürüm 18 veya üzeri önerilir)
- `npm` (Node.js ile birlikte gelir)

### 2. Bağımlılıkları Yükleme
Terminal veya komut satırını proje klasöründe açıp çalıştırın:

```bash
npm install
```

### 3. Geliştirici Sunucusunu Başlatma
```bash
npm run dev
```
Terminalde çıkan adrese (genellikle `http://localhost:3000` veya `http://localhost:5173`) tarayıcınızdan girin.

### 4. Canlı (Production) Derleme
```bash
npm run build
```
Derlenen dosyalar `dist/` klasörüne çıkacaktır.

---

## 🐙 GitHub'a Yükleme Adımları

Projeyi kendi GitHub hesabınıza yüklemek için:

1. [GitHub](https://github.com/new)'da yeni ve boş bir depo (repository) oluşturun (örneğin: `foto-pdf-cevirici`).
2. Bilgisayarınızdaki proje klasöründe terminali açıp şu komutları sırasıyla çalıştırın:

```bash
# Git deposunu başlatın
git init

# Dosyaları ekleyin
git add .

# İlk commit'i oluşturun
git commit -m "feat: ilk sürüm - çevrimdışı fotoğraftan pdf'e dönüştürücü pwa"

# Ana dalı 'main' yapın
git branch -M main

# Kendi GitHub deponuzun linkini ekleyin:
git remote add origin https://github.com/<KULLANICI_ADINIZ>/foto-pdf-cevirici.git

# GitHub'a gönderin:
git push -u origin main
```

---

## 🛠️ Proje Yapısı

```
├── public/                 # PWA ikonları, manifest ve servis çalışanı varlıkları
│   ├── icon.svg
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── pwa-maskable-512x512.png
├── src/
│   ├── components/         # React bileşenleri
│   │   ├── Header.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── ImageItemCard.tsx
│   │   ├── PdfSettingsPanel.tsx
│   │   ├── ImagePreviewModal.tsx
│   │   ├── PdfResultModal.tsx
│   │   ├── PWAInstallButton.tsx
│   │   └── OfflineIndicator.tsx
│   ├── hooks/              # PWA ve bağlantı hook'ları
│   │   ├── usePWAInstall.ts
│   │   └── useOnlineStatus.ts
│   ├── utils/              # İstemci taraflı iş mantığı
│   │   ├── imageProcessing.ts  # Canvas filtreleri, döndürme ve sıkıştırma
│   │   └── pdfGenerator.ts    # jsPDF ile çevrimdışı PDF oluşturma
│   ├── types.ts            # TypeScript tipleri
│   ├── App.tsx             # Ana uygulama ekranı
│   └── main.tsx            # Giriş noktası ve PWA kaydı
├── package.json
└── vite.config.ts          # Vite & VitePWA yapılandırması
```

---

## 💡 Geliştirilebilecek Fikirler (Sonraki Adımlar)

- [ ] **Kırpma (Crop) ve Köşe Düzeltme**: Doküman tarayıcıları gibi 4 köşeden perspektif düzeltme.
- [ ] **Sürükle-Bırak Sayfa Sıralaması**: Mobilde dokunarak sayfaları sürükleyip bırakma.
- [ ] **PDF Şifreleme**: Oluşturulan PDF'e parola koyma seçeneği.
- [ ] **Mevcut PDF'leri Birleştirme**: Hem fotoğraf hem de mevcut bir PDF dosyasını birleştirme.
