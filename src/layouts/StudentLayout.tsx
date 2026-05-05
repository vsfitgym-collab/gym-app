import React, { useState, useEffect } from 'react';
import { Navigate } from "react-router-dom"
import { StudentSidebar } from "@/components/sidebar/StudentSidebar"
import { useAuthStore } from "@/stores/authStore"
import { useSubscription } from "@/hooks/useFeatureAccess"
import { PageLoading } from "@/components/ui/Loading"
import { LockedScreen } from "@/components/features/LockedScreen"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { OfflinePage } from "@/pages/OfflinePage"
import { PageTransition } from "@/components/PageTransition"

interface LayoutProps {
  children?: React.ReactNode
}

export function StudentLayout({ children }: LayoutProps) {
  const { user, loading, initialized } = useAuthStore()
  const { subscription, loading: subLoading } = useSubscription()
  const { isInstallable, installApp } = useInstallPrompt()
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <OfflinePage />;
  }

  if (!initialized || loading || subLoading) {
    return <PageLoading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== "student") {
    return <Navigate to="/trainer" replace />
  }

  const isExpired = subscription?.status === 'expired' || 
    (subscription?.end_date && new Date(subscription.end_date) < new Date())

  if (isExpired) {
    return <LockedScreen fullScreen title="Assinatura expirada" message="Renove agora para continuar usando o app" />
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Install Banner */}
      {isInstallable && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-3 flex justify-between items-center shadow-lg animate-in slide-in-from-top duration-300">
          <p className="text-sm font-medium">Instale o App para melhor experiência!</p>
          <button 
            onClick={installApp}
            className="bg-white text-blue-600 px-4 py-1 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors"
          >
            Instalar
          </button>
        </div>
      )}

      <StudentSidebar />
      
      <main className="flex-1 w-full overflow-y-auto">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 lg:pl-72 max-w-7xl mx-auto">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  )
}
