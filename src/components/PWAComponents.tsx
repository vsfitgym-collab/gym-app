import { Download, X, Smartphone } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { usePWA } from '../hooks/usePWA'
import './PWAComponents.css'

export function PWAInstallBanner() {
  const location = useLocation()
  const { showInstallBanner, promptInstall, dismissInstallBanner } = usePWA()
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/cadastro'

  if (!showInstallBanner || isAuthPage) return null

  return (
    <div className="pwa-banner">
      <div className="pwa-banner-content">
        <div className="pwa-banner-icon">
          <Smartphone size={20} />
        </div>
        <div className="pwa-banner-text">
          <h4>Instalar App</h4>
          <p>Adicione à tela inicial para acesso rápido</p>
        </div>
        <button 
          className="pwa-banner-close" 
          onClick={dismissInstallBanner}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>
      <div className="pwa-banner-actions">
        <button onClick={promptInstall} className="pwa-banner-btn-install">
          <Download size={16} />
          Instalar
        </button>
      </div>
    </div>
  )
}

export function PWAInstallPrompt() {
  return <PWAInstallBanner />
}

export function PWAOfflineNotice() {
  const { isOffline } = usePWA()

  if (!isOffline) return null

  return (
    <div className="pwa-offline-notice">
      <span>📡</span>
      <span>Você está offline. Alguns recursos podem estar limitados.</span>
    </div>
  )
}

export function PWAUpdateNotification() {
  const { isUpdateAvailable, updateApp, dismissUpdate } = usePWA()

  if (!isUpdateAvailable) return null

  return (
    <div className="pwa-update-notification">
      <div className="pwa-update-content">
        <h4>Nova versão disponível</h4>
        <p>Atualize para obter as últimas melhorias</p>
      </div>
      <div className="pwa-update-actions">
        <button onClick={updateApp} className="pwa-btn-update">
          Atualizar
        </button>
        <button onClick={dismissUpdate} className="pwa-btn-dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export function PWANotifications() {
  return (
    <>
      <PWAInstallBanner />
      <PWAOfflineNotice />
      <PWAUpdateNotification />
    </>
  )
}
