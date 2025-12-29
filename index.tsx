import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Only register the Service Worker in production builds.
if ('serviceWorker' in navigator) {
  // In development, immediately unregister any service workers
  if (import.meta.env && import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        reg.unregister().then(() => {
          console.log('Unregistered stale SW in dev');
          // Clear all caches
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          }).then(() => {
            console.log('All caches cleared');
            // Force reload if we're in a service worker controlled page
            if (navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      });
    }).catch(() => {});
  } else {
    // In production, register service worker on load
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  }
}


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Bridge browser events to React app using a simple dispatch on window
// This avoids prop drilling for one-off global actions like starting Daily Mode.
window.addEventListener('soen:bridge', (e: any) => {
  if (e?.detail?.type === 'startDailyMode') {
    // Signal to App via a custom event that it can listen for
    window.dispatchEvent(new Event('soen:open-daily-mode'));
  }
});