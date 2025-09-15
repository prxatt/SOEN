import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // FIX: Using an explicitly relative path is more robust for sandboxed environments.
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
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
window.addEventListener('praxis:bridge', (e: any) => {
  if (e?.detail?.type === 'startDailyMode') {
    // Signal to App via a custom event that it can listen for
    window.dispatchEvent(new Event('praxis:open-daily-mode'));
  }
});