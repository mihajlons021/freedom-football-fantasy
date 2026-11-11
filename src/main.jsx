import React from 'react'
import ReactDOM from 'react-dom/client'
// v3: free Career mode with the new UI and live match engine. The old token version stays in App.jsx (tokens are paused).
import App from './v3/App3.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
