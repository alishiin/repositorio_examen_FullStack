import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global-responsive.css'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './pwa/registerSW.js'

registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
