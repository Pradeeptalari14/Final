import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// import { registerSW } from 'virtual:pwa-register'
// registerSW({ immediate: true })

// One-time cleanup: Remove old localStorage-based chat data from the previous version.
// The old GlobalChat stored messages locally and injected an auto-reply message.
// This cleans it up so users no longer see the stale "Thanks for the message!" auto-reply.
localStorage.removeItem('unicharm_global_chat');

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

