import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Register PWA Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((registration) => {
                console.log('[PWA] Service Worker berhasil aktif dengan scope:', registration.scope);
                
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (installingWorker) {
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[PWA] Versi baru aplikasi telah siap digunakan.');
                            }
                        };
                    }
                };
            })
            .catch((error) => {
                console.warn('[PWA] Gagal meregistrasi Service Worker:', error);
            });
    }
}

if (document.readyState === 'complete') {
    registerServiceWorker();
} else {
    window.addEventListener('load', registerServiceWorker);
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
