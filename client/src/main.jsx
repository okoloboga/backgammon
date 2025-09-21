import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import { analyticsService } from './services/analyticsService'
import { Buffer } from 'buffer'

// Полифил для Buffer в браузере
window.Buffer = Buffer

// Инициализация Telegram WebApp
if (window.Telegram && window.Telegram.WebApp) {
  window.Telegram.WebApp.ready()
  window.Telegram.WebApp.expand()

  window.Telegram.WebApp.BackButton.onClick(() => {
    console.log('Back button clicked')
    analyticsService.trackButtonClick('back_button', 'app')
  })
} else {
  console.warn('Running outside Telegram, mocking WebApp')
  window.Telegram = {
    WebApp: {
      isVersionAtLeast: () => true,
      ready: () => {},
      expand: () => {},
      BackButton: {
        show: () => {},
        hide: () => {},
        onClick: () => {}
      }
    }
  }
}

// Инициализация аналитики
// analyticsService.init()
// analyticsService.trackEvent('app_launched')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)