import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Only register the Service Worker in production builds.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env && import.meta.env.PROD) {
      navigator.serviceWorker.register('./sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    } else {
      // In development, ensure any previously installed SWs are unregistered
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
          reg.unregister().then(() => console.log('Unregistered stale SW in dev'));
        });
      }).catch(() => {});
    }
  });
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