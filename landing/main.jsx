// Inicializa GlitchTip (Sentry-compatible). DSN inyectada en build via VITE_GLITCHTIP_DSN.
import * as __Sentry from '@sentry/browser';
const __dsn = import.meta.env.VITE_GLITCHTIP_DSN;
if (__dsn) {
  __Sentry.init({
    dsn: __dsn,
    release: 'hardcoded-api-key-detector',
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.01,
  });
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
