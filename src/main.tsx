import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ============================================================
// CACHE BUSTING: This block forces a full cache clear to remove
// old cached JS bundles that contained a fake auto-reply message.
// Safe to remove after all users have loaded the app once.
// ============================================================
(async () => {
    // 1. Unregister all service workers (they were caching old bundles)
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
    }

    // 2. Clear all browser caches
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // 3. Clear legacy localStorage chat data (old auto-reply messages)
    localStorage.removeItem('unicharm_global_chat');
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

