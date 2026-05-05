import React, { useState, useEffect } from 'react';
import { Navigate } from "react-router-dom"
import { StudentSidebar } from "@/components/sidebar/StudentSidebar"
import { useAuthStore } from "@/stores/authStore"
import { useSubscription } from "@/hooks/useFeatureAccess"
import { PageLoading } from "@/components/ui/Loading"
import { LockedScreen } from "@/components/features/LockedScreen"
import { OfflinePage } from "@/pages/OfflinePage"
import { PageTransition } from "@/components/PageTransition"

interface LayoutProps {
  children?: React.ReactNode
}

export function StudentLayout({ children }: LayoutProps) {
  const { user, loading, initialized } = useAuthStore()
  const { subscription, loading: subLoading } = useSubscription()
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
