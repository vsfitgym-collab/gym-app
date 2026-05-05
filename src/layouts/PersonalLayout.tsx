import { Navigate } from "react-router-dom"
import { PersonalSidebar } from "@/components/sidebar/PersonalSidebar"
import { useAuthStore } from "@/stores/authStore"
import { PageLoading } from "@/components/ui/Loading"
import { PageTransition } from "@/components/PageTransition"

interface LayoutProps {
  children?: React.ReactNode
}

export function PersonalLayout({ children }: LayoutProps) {
  const { user, loading, initialized } = useAuthStore()

  if (!initialized || loading) {
    return <PageLoading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== "trainer") {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <PersonalSidebar />
      
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
