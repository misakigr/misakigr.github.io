import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import CardDetails from './pages/CardDetails'
import { useCardsStore } from './store/useCardsStore'
import './index.css'

function App() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { loadCards } = useCardsStore()

  useEffect(() => {
    loadCards()
  }, [loadCards])

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowUpdateBanner(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowUpdateBanner(false)
    }

    const handleOnline = () => {
      const banner = document.getElementById('offlineBanner')
      if (banner) banner.classList.remove('visible')
    }

    const handleOffline = () => {
      const banner = document.getElementById('offlineBanner')
      if (banner) banner.classList.add('visible')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const handleServiceWorkerUpdate = (registration) => {
      if (registration.waiting) {
        const banner = document.getElementById('updateBanner')
        if (banner) banner.classList.add('visible')
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker?.addEventListener('controllerchange', () => {
        window.location.reload()
      })
      
      navigator.serviceWorker?.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                handleServiceWorkerUpdate(registration)
              }
            })
          }
        })
      })
    }
  }, [])
  
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowUpdateBanner(false)
      }
      setDeferredPrompt(null)
    } else {
      setShowUpdateBanner(false)
    }
  }

  const handleUpdateClick = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker?.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
        setShowUpdateBanner(false)
      })
    }
  }

  const handleDismissOffline = () => {
    const banner = document.getElementById('offlineBanner')
    if (banner) banner.classList.remove('visible')
  }

  const isHomePage = location.pathname === '/' || location.pathname === '/Wallet/' || location.pathname === '/Wallet'

  return (
    <div className="app-shell">
      {!isHomePage && (
        <>
          <header className="statusbar">
            <div>
              <div id="clock">14:45</div>
              <small>Wallet Cards</small>
            </div>
            <div className="status-icons">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 16H7V20H4V16ZM10 12H13V20H10V12ZM16 8H19V20H16V8Z" fill="currentColor"/>
              </svg>
              <div>LTE</div>
              <div className="battery" id="batteryLevel">55</div>
            </div>
          </header>
        </>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Wallet" element={<Home />} />
        <Route path="/card/:id" element={<CardDetails />} />
        <Route path="/Wallet/card/:id" element={<CardDetails />} />
      </Routes>

      {isHomePage && (
        <>
          <nav className="bottom-nav" aria-label="Нижняя навигация">
            <button type="button" className="nav-item active" data-nav="home">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="5" width="16" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
                <circle cx="17" cy="12" r="1.5" fill="currentColor"/>
              </svg>
              <span>Главная</span>
            </button>
            <button type="button" className="nav-item" data-nav="catalog">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 5H5C4.45 5 4 5.45 4 6V10C4 10.55 4.45 11 5 11H9C9.55 11 10 10.55 10 10V6C10 5.45 9.55 5 9 5Z" stroke="currentColor" stroke-width="1.7"/>
                <path d="M19 5H15C14.45 5 14 5.45 14 6V10C14 10.55 14.45 11 15 11H19C19.55 11 20 10.55 20 10V6C20 5.45 19.55 5 19 5Z" stroke="currentColor" stroke-width="1.7"/>
                <path d="M9 13H5C4.45 13 4 13.45 4 14V18C4 18.55 4.45 19 5 19H9C9.55 19 10 18.55 10 18V14C10 13.45 9.55 13 9 13Z" stroke="currentColor" stroke-width="1.7"/>
                <path d="M19 13H15C14.45 13 14 13.45 14 14V18C14 18.55 14.45 19 15 19H19C19.55 19 20 18.55 20 18V14C20 13.45 19.55 13 19 13Z" stroke="currentColor" stroke-width="1.7"/>
              </svg>
              <span>Каталог</span>
            </button>
            <button type="button" className="nav-item" data-nav="benefits">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 4L16 20M16 4L8 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              <span>Выгода</span>
            </button>
            <button type="button" className="nav-item" data-nav="more">
              <span className="nav-badge">Акция</span>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              <span>Ещё</span>
            </button>
          </nav>
        </>
      )}

      <div className={`banner ${showUpdateBanner ? 'visible' : ''}`} id="updateBanner">
        <div className="banner-card">
          <div>
            <strong>Доступно обновление</strong>
            <span>Скачайте свежую версию приложения.</span>
          </div>
          <button type="button" id="updateButton" onClick={handleUpdateClick}>Обновить</button>
        </div>
      </div>

      <div className="banner" id="offlineBanner">
        <div className="banner-card">
          <div>
            <strong>Оффлайн режим</strong>
            <span>Данные карт доступны локально на устройстве.</span>
          </div>
          <button type="button" id="offlineDismiss" onClick={handleDismissOffline}>Скрыть</button>
        </div>
      </div>

      <div className={`banner ${showUpdateBanner ? 'visible' : ''}`} id="installBanner">
        <div className="banner-card">
          <div>
            <strong>Установить Wallet</strong>
            <span>Добавьте приложение на домашний экран.</span>
          </div>
          <button type="button" id="installButton" onClick={handleInstallClick}>Установить</button>
        </div>
      </div>
    </div>
  )
}

export default App