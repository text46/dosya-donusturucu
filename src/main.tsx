import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with instant auto-update and auto-refresh
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // A new version was deployed, automatically activate and refresh page!
    console.log('[PWA] Yeni sürüm algılandı, otomatik güncelleniyor...');
    updateSW(true);
  },
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Periodically check for new updates every 15 minutes while app is running
      setInterval(() => {
        registration.update();
      }, 15 * 60 * 1000);

      // Instantly check for updates when device reconnects to internet
      window.addEventListener('online', () => {
        console.log('[PWA] İnternet bağlantısı sağlandı, güncelleme kontrol ediliyor...');
        registration.update();
      });

      // Also check when user returns/focuses back to the app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      });
    }
  },
});

createRoot(document.getElementById('root')!).render(<App />);
