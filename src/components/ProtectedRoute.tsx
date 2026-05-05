import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { PageLoading } from "@/components/ui/Loading"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('student' | 'trainer')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, initialized, profileExtended } = useAuthStore()
  const location = useLocation()

  if (!initialized || loading) {
    return <PageLoading />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'trainer') {
      return <Navigate to="/trainer" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  if (user.role === 'student' && profileExtended && !profileExtended.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}