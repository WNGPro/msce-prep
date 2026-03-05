import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initOfflineSync } from './lib/sync'

// Start background offline sync when back online
initOfflineSync()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
