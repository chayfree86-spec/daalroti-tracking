import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { checkAndClearCache } from './lib/cacheManager'

// Check for new deployment BEFORE mounting React.
// If a new version is detected, caches are cleared and page reloads —
// the function returns false and we skip rendering.
checkAndClearCache().then((shouldRender) => {
  if (!shouldRender) return // Page is reloading with fresh assets

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  )
})
