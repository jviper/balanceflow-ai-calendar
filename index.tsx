
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only register on secure origins (https) or localhost, not from file://
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.')) {
      const swUrl = '/service-worker.js';
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('Service Worker registered successfully with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    } else {
      console.warn('Service Worker not registered: context is not secure or localhost.');
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
