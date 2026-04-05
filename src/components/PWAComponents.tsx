import { Download, X } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'
import './PWAComponents.css'

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA()

  if (!isInstallable) return null

  return (
    <div className="pwa-prompt install-prompt">
      <div className="pwa-prompt-icon">
        <Download size={24} />
      </div>
      <div className="pwa-prompt-content">
        <h4>Instalar VSFit Gym</h4>
        <p>Adicione à tela inicial para uma experiência completa</p>
      </div>
      <div className="pwa-prompt-actions">
        <button onClick={promptInstall} className="pwa-btn-install">
          Instalar
        </button>
      </div>
    </div>
  )
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
        <p>Atualize para получить as últimas melhorias</p>
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
      <PWAInstallPrompt />
      <PWAOfflineNotice />
      <PWAUpdateNotification />
    </>
  )
}
