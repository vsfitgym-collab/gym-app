import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'
import { useAuthStore } from './stores/authStore'
import { useEffect, useState, Suspense } from 'react'
import { SplashScreen } from './components/SplashScreen'
import { PageLoading } from './components/ui/Loading'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const initialized = useAuthStore((state) => state.initialized)
  const initAuth = useAuthStore((state) => state.initAuth)
  const ref = React.useRef(false)

  useEffect(() => {
    if (ref.current) return
    ref.current = true
    initAuth()
  }, [])

  const [isSplashVisible, setIsSplashVisible] = useState(true)

  useEffect(() => {
    const maxSplashTimer = window.setTimeout(() => setIsSplashVisible(false), 2400)
    return () => window.clearTimeout(maxSplashTimer)
  }, [])

  useEffect(() => {
    if (initialized) {
      const timer = window.setTimeout(() => setIsSplashVisible(false), 450)
      return () => window.clearTimeout(timer)
    }
  }, [initialized])

  return (
    <>
      <SplashScreen isVisible={isSplashVisible} />
      <ErrorBoundary>
        <Suspense fallback={<PageLoading />}>
          <RouterProvider router={router} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
