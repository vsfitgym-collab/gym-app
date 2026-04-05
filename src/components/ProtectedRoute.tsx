import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserRole } from '../hooks/useUserRole'
import type { UserRole, UserPermissions } from '../types'
import './ProtectedRoute.css'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requiredRole?: UserRole
  requiredPermission?: keyof UserPermissions
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
}

function LoadingScreen() {
  return (
    <div className="protected-route-loading">
      <div className="loading-spinner" />
      <span>Verificando acesso...</span>
    </div>
  )
}

function AccessDenied({ 
  requiredRole, 
  requiredPermission,
  message 
}: { 
  requiredRole?: UserRole
  requiredPermission?: keyof UserPermissions
  message?: string
}) {
  return (
    <div className="access-denied">
      <div className="access-denied-icon">🔒</div>
      <h2>Acesso Negado</h2>
      <p>{message || 'Você não tem permissão para acessar esta página.'}</p>
      {requiredRole && (
        <span className="required-info">
          Requer função: <strong>{requiredRole === 'personal' ? 'Personal Trainer' : 'Aluno'}</strong>
        </span>
      )}
      {requiredPermission && (
        <span className="required-info">
          Requer permissão: <strong>{requiredPermission}</strong>
        </span>
      )}
      <button onClick={() => window.history.back()}>
        Voltar
      </button>
    </div>
  )
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole,
  requiredPermission,
  fallback,
  loadingFallback
}: ProtectedRouteProps) {
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { role, hasPermission, loading: roleLoading } = useUserRole()

  const loading = authLoading || roleLoading

  if (loading) {
    return loadingFallback ? <>{loadingFallback}</> : <LoadingScreen />
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && role !== requiredRole) {
    if (fallback) return <>{fallback}</>
    
    return (
      <AccessDenied 
        requiredRole={requiredRole}
        message={`Esta página é apenas para ${requiredRole === 'personal' ? 'Personal Trainers' : 'Alunos'}.`}
      />
    )
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) return <>{fallback}</>
    
    return (
      <AccessDenied 
        requiredPermission={requiredPermission}
        message={`Você não tem a permissão necessária: ${requiredPermission}`}
      />
    )
  }

  return <>{children}</>
}

export function RoleRoute({ 
  children, 
  role: requiredRole 
}: { 
  children: React.ReactNode
  role: UserRole 
}) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      {children}
    </ProtectedRoute>
  )
}

export function PermissionRoute({ 
  children, 
  permission: requiredPermission 
}: { 
  children: React.ReactNode
  permission: keyof UserPermissions 
}) {
  return (
    <ProtectedRoute requiredPermission={requiredPermission}>
      {children}
    </ProtectedRoute>
  )
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null
  }

  if (user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <>{children}</>
}
