import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface UsePWAResult {
  isInstallable: boolean
  isInstalled: boolean
  isOffline: boolean
  isUpdateAvailable: boolean
  promptInstall: () => Promise<void>
  updateApp: () => void
  dismissUpdate: () => void
}

export function usePWA(): UsePWAResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true
    setIsInstalled(isStandalone)

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope)
        setServiceWorkerRegistration(registration)

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true)
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error)
      })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully')
      setDeferredPrompt(null)
      setIsInstalled(true)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    console.log('[PWA] Install prompt result:', outcome)
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const updateApp = useCallback(() => {
    if (serviceWorkerRegistration) {
      serviceWorkerRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [serviceWorkerRegistration])

  const dismissUpdate = useCallback(() => {
    setIsUpdateAvailable(false)
  }, [])

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isOffline,
    isUpdateAvailable,
    promptInstall,
    updateApp,
    dismissUpdate
  }
}
